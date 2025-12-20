import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Referral from '@/models/Referral';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Generate unique referral code
function generateReferralCode(name = '') {
  const namePrefix = name.substring(0, 3).toUpperCase() || 'REF';
  const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${namePrefix}${randomString}`;
}

// Reward amounts (in rupees)
const REWARDS = {
  SIGNUP_BONUS: 100, // Bonus for signing up using referral
  REFERRER_BONUS: 200, // Bonus for referrer when someone signs up
  REFERRER_COMMISSION: 0.05, // 5% commission on referred user's first order
};

// GET - Get user's referral info
export async function GET(request) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let referral = await Referral.findOne({ userId });

    // Create referral entry if doesn't exist
    if (!referral) {
      const user = await clerkClient.users.getUser(userId);
      const referralCode = generateReferralCode(user.firstName);

      referral = await Referral.create({
        userId,
        referralCode,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        referralCode: referral.referralCode,
        totalReferrals: referral.totalReferrals,
        successfulReferrals: referral.successfulReferrals,
        availableBalance: referral.availableBalance,
        totalEarnings: referral.totalEarnings,
        referrals: referral.referrals,
        rewards: referral.rewards.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Get referral error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch referral data',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Apply referral code (when signing up)
export async function POST(request) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { success: false, message: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find referrer
    const referrer = await Referral.findOne({ 
      referralCode: referralCode.toUpperCase() 
    });

    if (!referrer) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Check if user already has a referral entry
    let userReferral = await Referral.findOne({ userId });

    if (userReferral && userReferral.referredBy) {
      return NextResponse.json(
        { success: false, message: 'You have already used a referral code' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await clerkClient.users.getUser(userId);

    // Create or update user's referral entry
    if (!userReferral) {
      const newReferralCode = generateReferralCode(user.firstName);
      userReferral = await Referral.create({
        userId,
        referralCode: newReferralCode,
        referredBy: referrer.userId,
      });
    } else {
      userReferral.referredBy = referrer.userId;
      await userReferral.save();
    }

    // Give signup bonus to new user
    userReferral.rewards.push({
      type: 'signup_bonus',
      amount: REWARDS.SIGNUP_BONUS,
      description: `Signup bonus for using referral code ${referralCode}`,
    });
    userReferral.availableBalance += REWARDS.SIGNUP_BONUS;
    userReferral.totalEarnings += REWARDS.SIGNUP_BONUS;
    await userReferral.save();

    // Give referral bonus to referrer
    referrer.referrals.push({
      userId,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      signedUpAt: new Date(),
    });
    referrer.totalReferrals += 1;
    referrer.rewards.push({
      type: 'referral_bonus',
      amount: REWARDS.REFERRER_BONUS,
      description: `Referral bonus for ${user.firstName || 'a friend'} joining`,
      referredUserId: userId,
    });
    referrer.availableBalance += REWARDS.REFERRER_BONUS;
    referrer.totalEarnings += REWARDS.REFERRER_BONUS;
    await referrer.save();

    return NextResponse.json({
      success: true,
      message: `Referral applied! You earned ₹${REWARDS.SIGNUP_BONUS}`,
      bonusAmount: REWARDS.SIGNUP_BONUS,
    });
  } catch (error) {
    console.error('Apply referral error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to apply referral code',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

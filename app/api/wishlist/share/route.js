import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import { auth } from '@clerk/nextjs/server';

// Shared wishlist model
import mongoose from 'mongoose';

const sharedWishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  shareId: { type: String, required: true, unique: true },
  productIds: [{ type: String, required: true }],
  message: { type: String, default: '' },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) }, // 30 days
});

const SharedWishlist = mongoose.models.SharedWishlist || mongoose.model('SharedWishlist', sharedWishlistSchema);

// Generate unique share ID
function generateShareId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// POST - Create shareable wishlist link
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
    const { productIds, userName, message } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const shareId = generateShareId();

    const sharedWishlist = await SharedWishlist.create({
      userId,
      userName: userName || 'A Sparrow Sports User',
      shareId,
      productIds,
      message: message || '',
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/shared/${shareId}`;

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      message: 'Wishlist shared successfully',
    });
  } catch (error) {
    console.error('Share wishlist error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to share wishlist',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Get shared wishlist
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { success: false, message: 'Share ID is required' },
        { status: 400 }
      );
    }

    const sharedWishlist = await SharedWishlist.findOne({ shareId });

    if (!sharedWishlist) {
      return NextResponse.json(
        { success: false, message: 'Shared wishlist not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > sharedWishlist.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'This shared wishlist has expired' },
        { status: 410 }
      );
    }

    // Increment view count
    sharedWishlist.viewCount += 1;
    await sharedWishlist.save();

    return NextResponse.json({
      success: true,
      data: {
        userName: sharedWishlist.userName,
        productIds: sharedWishlist.productIds,
        message: sharedWishlist.message,
        viewCount: sharedWishlist.viewCount,
        createdAt: sharedWishlist.createdAt,
      },
    });
  } catch (error) {
    console.error('Get shared wishlist error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch shared wishlist',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

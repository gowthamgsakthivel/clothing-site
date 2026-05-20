import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import NewsletterSubscriber from '@/models/NewsletterSubscriber';

const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export async function GET(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                success: true,
                isSubscribed: false
            });
        }

        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();

        if (!email) {
            return NextResponse.json({
                success: true,
                isSubscribed: false
            });
        }

        await connectDB();
        const subscriber = await NewsletterSubscriber.findOne({ email });

        return NextResponse.json({
            success: true,
            isSubscribed: Boolean(subscriber)
        });
    } catch (error) {
        console.error('Newsletter check error:', error);
        return NextResponse.json({
            success: true,
            isSubscribed: false
        });
    }
}

export async function POST(request) {
    try {
        const { userId } = await auth();
        const body = await request.json();
        const source = body?.source?.trim() || 'website';
        let email = body?.email?.trim().toLowerCase();

        if (userId) {
            const user = await currentUser();
            email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || email;
        }

        if (!email) {
            return NextResponse.json({
                success: false,
                message: 'Email is required'
            }, { status: 400 });
        }

        if (!emailPattern.test(email)) {
            return NextResponse.json({
                success: false,
                message: 'Please enter a valid email'
            }, { status: 400 });
        }

        await connectDB();

        const existingSubscriber = await NewsletterSubscriber.findOne({ email });

        if (existingSubscriber) {
            return NextResponse.json({
                success: true,
                message: 'You are already subscribed to the newsletter'
            });
        }

        await NewsletterSubscriber.create({
            email,
            source,
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '',
            userAgent: request.headers.get('user-agent') || ''
        });

        return NextResponse.json({
            success: true,
            message: 'Subscribed successfully'
        });
    } catch (error) {
        if (error?.code === 11000) {
            return NextResponse.json({
                success: true,
                message: 'You are already subscribed to the newsletter'
            });
        }

        console.error('Newsletter subscription error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to subscribe. Please try again later.'
        }, { status: 500 });
    }
}
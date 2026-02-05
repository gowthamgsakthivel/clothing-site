import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Contact from '@/models/Contact';
import { sendContactNotification, sendAutoReply, verifyEmailConnection } from '@/lib/emailService';

export async function POST(request) {
    try {
        // Connect to database
        await connectDB();

        // Parse request body
        const { name, email, message } = await request.json();

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { success: false, message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // Validate message length
        if (message.length > 1000) {
            return NextResponse.json(
                { success: false, message: 'Message cannot exceed 1000 characters' },
                { status: 400 }
            );
        }

        // Get client information
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Save to database
        const contactMessage = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            ipAddress,
            userAgent
        });

        await contactMessage.save();

        // Verify email connection
        const emailReady = await verifyEmailConnection();

        if (emailReady) {
            // Send emails (don't wait for them to complete)
            Promise.all([
                sendContactNotification({ name, email, message }),
                sendAutoReply(email, name)
            ]).then(([adminResult, customerResult]) => {
                //console.log('Email results:', { adminResult, customerResult });
            }).catch(error => {
                console.error('Email sending error:', error);
            });
        } else {
            console.warn('⚠️ Email service not available, but message saved to database');
        }

        return NextResponse.json({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.',
            id: contactMessage._id
        }, { status: 201 });

    } catch (error) {
        console.error('Contact form error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return NextResponse.json(
                { success: false, message: errors[0] },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Something went wrong. Please try again later.' },
            { status: 500 }
        );
    }
}

// GET method to retrieve contact messages (for admin)
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Get messages with pagination
        const messages = await Contact.find(filter)
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count
        const totalMessages = await Contact.countDocuments(filter);
        const totalPages = Math.ceil(totalMessages / limit);

        // Get status counts
        const statusCounts = await Contact.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusStats = statusCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            data: {
                messages,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalMessages,
                    limit
                },
                statusStats
            }
        });

    } catch (error) {
        console.error('Error fetching contact messages:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}
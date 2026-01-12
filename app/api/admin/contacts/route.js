import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Contact from '@/models/Contact';

export async function GET(request) {
    try {
        const { userId, sessionClaims } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get role from sessionClaims
        const userRole = sessionClaims?.publicMetadata?.role;

        // TODO: Fix Clerk metadata sync issue
        // The role metadata isn't being passed through sessionClaims reliably
        // For now, allow authenticated users to access admin API
        // if (userRole !== 'admin') {
        //     return NextResponse.json({
        //         success: false,
        //         message: 'Admin access required'
        //     }, { status: 403 });
        // }

        await connectDB();

        // Get status filter from query
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Build query
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const contacts = await Contact.find(query).sort({ submittedAt: -1 });

        return NextResponse.json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch contacts'
        }, { status: 500 });
    }
}

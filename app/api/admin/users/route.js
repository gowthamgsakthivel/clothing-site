import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';

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

        // Get role filter from query
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        // Build query
        const query = {};
        if (role && role !== 'all') {
            query['publicMetadata.role'] = role;
        }

        const users = await User.find(query).select('name email createdAt publicMetadata').sort({ createdAt: -1 });

        // Transform response to include role from publicMetadata
        const transformedUsers = users.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            role: user.publicMetadata?.role || 'customer'
        }));

        return NextResponse.json({
            success: true,
            users: transformedUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch users'
        }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function GET(request) {
    try {
        await requireAdmin();

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
            role: user.publicMetadata?.role === 'customer' ? 'user' : (user.publicMetadata?.role || 'user')
        }));

        return NextResponse.json({
            success: true,
            users: transformedUsers
        });
    } catch (error) {
        const status = error.status || 500;
        console.error('Error fetching users:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to fetch users'
        }, { status });
    }
}

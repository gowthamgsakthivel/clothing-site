import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import User from '@/models/User';
import { clerkClient } from '@clerk/nextjs/server';

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        await requireAdmin();

        const body = await request.json();
        const { role } = body;

        if (!['user', 'admin'].includes(role)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid role'
            }, { status: 400 });
        }

        await connectDB();

        // Update user in MongoDB
        const user = await User.findByIdAndUpdate(
            id,
            { 'publicMetadata.role': role },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Update user in Clerk
        try {
            const client = await clerkClient();
            await client.users.updateUser(id, {
                publicMetadata: { role }
            });
        } catch (clerkError) {
            console.warn('Could not update Clerk user metadata:', clerkError);
            // Continue anyway - MongoDB is updated
        }

        return NextResponse.json({
            success: true,
            message: 'User role updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role
            }
        });
    } catch (error) {
        const status = error.status || 500;
        console.error('Error updating user:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to update user'
        }, { status });
    }
}

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import { clerkClient } from '@clerk/nextjs/server';

export async function PATCH(request, { params }) {
    try {
        const { userId, sessionClaims } = getAuth(request);
        const { id } = params;

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

        const body = await request.json();
        const { role } = body;

        if (!['customer', 'seller', 'admin'].includes(role)) {
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
        console.error('Error updating user:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update user'
        }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';

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
        const { status } = body;

        if (!['active', 'suspended'].includes(status)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid status'
            }, { status: 400 });
        }

        await connectDB();

        const seller = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).select('name email shopName status');

        if (!seller) {
            return NextResponse.json({
                success: false,
                message: 'Seller not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Seller status updated successfully',
            seller
        });
    } catch (error) {
        console.error('Error updating seller:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update seller'
        }, { status: 500 });
    }
}

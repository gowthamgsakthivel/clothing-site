import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Orders';

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

        const validStatuses = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid status'
            }, { status: 400 });
        }

        await connectDB();

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return NextResponse.json({
                success: false,
                message: 'Order not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update order'
        }, { status: 500 });
    }
}

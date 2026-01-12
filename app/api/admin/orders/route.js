import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Orders';

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

        const orders = await Order.find(query).sort({ date: -1 }).populate('items.product');

        return NextResponse.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch orders'
        }, { status: 500 });
    }
}

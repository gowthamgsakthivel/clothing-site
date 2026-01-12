import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Order from "@/models/Orders";

export async function POST(request) {
    console.log("⭐ Starting order status update API");
    try {
        const { userId } = getAuth(request);
        console.log("👤 User auth check for user:", userId);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Check if user is a seller
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({
                success: false,
                message: 'Not authorized. Seller access required.'
            }, { status: 403 });
        }

        await connectDB();

        // Get request body
        const { orderId, newStatus } = await request.json();

        console.log(`📝 Updating order ${orderId} to status: ${newStatus}`);

        if (!orderId || !newStatus) {
            return NextResponse.json({
                success: false,
                message: 'Order ID and new status are required'
            }, { status: 400 });
        }

        // Valid status progression
        const validStatuses = ['Order Placed', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Completed'];
        if (!validStatuses.includes(newStatus)) {
            return NextResponse.json({
                success: false,
                message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            }, { status: 400 });
        }

        // Find and update the order
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: newStatus },
            { new: true }
        ).lean();

        if (!order) {
            return NextResponse.json({
                success: false,
                message: 'Order not found'
            }, { status: 404 });
        }

        console.log(`✅ Order ${orderId} updated to status: ${newStatus}`);

        return NextResponse.json({
            success: true,
            message: `Order status updated to ${newStatus}`,
            order
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error updating order status:', error);
        return NextResponse.json({
            success: false,
            message: 'Error updating order status: ' + error.message
        }, { status: 500 });
    }
}

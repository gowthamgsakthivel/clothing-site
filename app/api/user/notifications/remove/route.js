import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";

export async function POST(request) {
    try {
        await connectDB();
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get request body
        const { productId, color, size } = await request.json();

        // Validate required fields
        if (!productId) {
            return NextResponse.json({
                success: false,
                message: 'Product ID is required'
            }, { status: 400 });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Make sure stockNotifications exists
        const stockNotifications = user.stockNotifications || [];

        // Update user's notifications - filter out the one to remove
        user.stockNotifications = stockNotifications.filter(notification => {
            // Safe comparison to handle potentially undefined values
            const notificationProductId = notification.productId ? notification.productId.toString() : '';
            const currentProductId = productId ? productId.toString() : '';

            return !(
                notificationProductId === currentProductId &&
                notification.color === color &&
                notification.size === size
            );
        });

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Notification removed successfully'
        });
    } catch (error) {
        console.error('Error removing stock notification:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to remove stock notification'
        }, { status: 500 });
    }
}
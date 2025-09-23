import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";

export async function GET(request) {
    try {
        await connectDB();
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Return user's stock notifications
        return NextResponse.json({
            success: true,
            notifications: user.stockNotifications || []
        });
    } catch (error) {
        console.error('Error fetching stock notifications:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch stock notifications'
        }, { status: 500 });
    }
}
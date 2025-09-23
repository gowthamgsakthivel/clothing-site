import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import CustomDesign from "@/models/CustomDesign";
import User from "@/models/User";
import connectDB from "@/config/db";

export async function POST(request) {
    try {
        // Authenticate seller
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get user using Clerk user ID as MongoDB _id
        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Check if the user is a seller
        if (!user.isSeller) {
            return NextResponse.json({
                success: false,
                message: 'Seller access required'
            }, { status: 403 });
        }

        // Parse request body
        const { designId, response, status, quote } = await request.json();

        // Validate input
        if (!designId) {
            return NextResponse.json({
                success: false,
                message: 'Design ID is required'
            }, { status: 400 });
        }

        // Find the custom design request
        const designRequest = await CustomDesign.findById(designId);
        if (!designRequest) {
            return NextResponse.json({
                success: false,
                message: 'Design request not found'
            }, { status: 404 });
        }

        // Update the design request with seller response
        const updates = {};

        // If response is provided, add seller response
        if (response) {
            updates.sellerResponse = {
                sellerId: user._id,
                message: response,
                timestamp: new Date()
            };
        }

        // If status change is requested
        if (status) {
            updates.status = status;
        }

        // If quote is provided
        if (quote && quote.amount) {
            updates.quote = {
                amount: quote.amount,
                details: quote.details || '',
                timestamp: new Date()
            };
        }

        // Update the design request
        const updatedDesign = await CustomDesign.findByIdAndUpdate(
            designId,
            { $set: updates },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Design request updated successfully',
            designRequest: updatedDesign
        });

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}
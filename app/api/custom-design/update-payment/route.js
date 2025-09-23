import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import CustomDesign from "@/models/CustomDesign";
import User from "@/models/User";
import connectDB from "@/config/db";

export async function POST(request) {
    console.log("⭐ Starting update payment for custom design API route");
    try {
        // Authenticate user
        const { userId } = getAuth(request);
        console.log("👤 Auth result:", { userId: userId || "undefined" });

        if (!userId) {
            console.log("❌ No userId found in auth");
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Connect to database
        console.log("🔌 Connecting to database...");
        try {
            await connectDB();
            console.log("✅ Connected to database");
        } catch (dbError) {
            console.error("❌ Database connection failed:", dbError);
            return NextResponse.json({
                success: false,
                message: 'Database connection failed: ' + dbError.message
            }, { status: 500 });
        }

        // Get user using Clerk user ID as MongoDB _id
        console.log("🔍 Finding user with ID:", userId);
        let user;
        try {
            user = await User.findById(userId);
        } catch (userError) {
            console.error("❌ Error finding user:", userError);
            return NextResponse.json({
                success: false,
                message: 'Error finding user: ' + userError.message
            }, { status: 500 });
        }

        if (!user) {
            console.log("❌ User not found with ID:", userId);
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }
        console.log("✅ Found user:", user.name);

        // Parse request body
        const requestData = await request.json();
        const { designId, paymentAmount, paymentMethod, paymentStatus, paymentDetails } = requestData;

        if (!designId) {
            console.log("❌ Missing design ID");
            return NextResponse.json({
                success: false,
                message: 'Design ID is required'
            }, { status: 400 });
        }

        // Find the design request
        console.log("🔍 Finding design request with ID:", designId);
        let designRequest;
        try {
            designRequest = await CustomDesign.findById(designId);
        } catch (findError) {
            console.error("❌ Error finding design request:", findError);
            return NextResponse.json({
                success: false,
                message: 'Error finding design request: ' + findError.message
            }, { status: 500 });
        }

        if (!designRequest) {
            console.log("❌ Design request not found with ID:", designId);
            return NextResponse.json({
                success: false,
                message: 'Design request not found'
            }, { status: 404 });
        }
        console.log("✅ Found design request");

        // Verify that the user owns this design request
        if (designRequest.user !== userId) {
            console.log("❌ User does not own this design request");
            return NextResponse.json({
                success: false,
                message: 'You do not have permission to update this design request'
            }, { status: 403 });
        }

        // Update the design request with payment information
        const updates = {
            advancePayment: {
                amount: paymentAmount,
                method: paymentMethod,
                status: paymentStatus,
                details: paymentDetails,
                timestamp: new Date()
            },
            isPriority: true, // Mark as priority since payment was made
            updatedAt: new Date()
        };

        console.log("💾 Updating design request with payment info:", updates);
        let updatedDesign;
        try {
            updatedDesign = await CustomDesign.findByIdAndUpdate(
                designId,
                { $set: updates },
                { new: true }
            );
            console.log("✅ Design request updated successfully");
        } catch (updateError) {
            console.error("❌ Error updating design request:", updateError);
            return NextResponse.json({
                success: false,
                message: 'Error updating design request: ' + updateError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment information updated successfully',
            designRequest: {
                _id: updatedDesign._id,
                status: updatedDesign.status,
                advancePayment: updatedDesign.advancePayment,
                isPriority: updatedDesign.isPriority
            }
        });

    } catch (error) {
        console.error("❌ Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}
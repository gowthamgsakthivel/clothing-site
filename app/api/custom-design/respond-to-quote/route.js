import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import CustomDesign from "@/models/CustomDesign";
import User from "@/models/User";
import connectDB from "@/config/db";

export async function POST(request) {
    console.log("⭐ Starting respond to quote API route");
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
        const body = await request.json();
        const { designId, response, message, counterOffer } = body;

        console.log("📝 Request payload:", {
            designId,
            response,
            message: message ? "Provided" : "Not provided",
            counterOffer: counterOffer ? counterOffer : "Not provided"
        });

        // Validate input
        if (!designId || !response) {
            console.log("❌ Missing required fields");
            return NextResponse.json({
                success: false,
                message: 'Design ID and response are required'
            }, { status: 400 });
        }

        if (!['accepted', 'rejected', 'negotiate'].includes(response)) {
            console.log("❌ Invalid response value:", response);
            return NextResponse.json({
                success: false,
                message: 'Response must be "accepted", "rejected", or "negotiate"'
            }, { status: 400 });
        }

        // If response is negotiate, counter offer amount is required
        if (response === 'negotiate') {
            console.log("🔍 Checking counter offer amount:", counterOffer, "Type:", typeof counterOffer);

            if (!counterOffer) {
                console.log("❌ Missing counter offer amount for negotiation");
                return NextResponse.json({
                    success: false,
                    message: 'Counter offer amount is required for negotiation'
                }, { status: 400 });
            }

            const offerAmount = parseFloat(counterOffer);
            if (isNaN(offerAmount)) {
                console.log("❌ Counter offer is not a number:", counterOffer);
                return NextResponse.json({
                    success: false,
                    message: 'Counter offer must be a valid number'
                }, { status: 400 });
            }

            if (offerAmount <= 0) {
                console.log("❌ Counter offer must be positive:", offerAmount);
                return NextResponse.json({
                    success: false,
                    message: 'Counter offer amount must be greater than zero'
                }, { status: 400 });
            }
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

        // Verify that the design has a quote and is in the 'quoted' status
        if (designRequest.status !== 'quoted' || !designRequest.quote || !designRequest.quote.amount) {
            console.log("❌ Design request does not have a pending quote");
            return NextResponse.json({
                success: false,
                message: 'This design request does not have a pending quote'
            }, { status: 400 });
        }

        // Update the design request based on the response
        const updates = {
            updatedAt: new Date()
        };

        // Set the appropriate status based on the response
        if (response === 'accepted') {
            updates.status = 'approved';
        } else if (response === 'rejected') {
            updates.status = 'rejected';
        } else if (response === 'negotiate') {
            updates.status = 'negotiating';
        }

        console.log("💾 Updating design request with status:", updates.status);

        // Handle specific response types
        if (response === 'rejected' && message) {
            // If the customer is rejecting with a message (change request), add it to the design
            updates.customerResponse = {
                message: message,
                timestamp: new Date()
            };
        } else if (response === 'negotiate') {
            // Add the counter offer to negotiation history
            const negotiationEntry = {
                offerBy: 'customer',
                amount: counterOffer,
                message: message || `Counter offer: ${counterOffer}`,
                timestamp: new Date()
            };

            // Add customer response for the seller to see
            updates.customerResponse = {
                message: message || `I'd like to negotiate. My counter offer is: ${counterOffer}`,
                timestamp: new Date()
            };
        }

        let updatedDesign;
        try {
            // Use appropriate update operation based on response type
            if (response === 'negotiate') {
                // For negotiation, push to the negotiationHistory array
                updatedDesign = await CustomDesign.findByIdAndUpdate(
                    designId,
                    {
                        $set: updates,
                        $push: {
                            negotiationHistory: {
                                offerBy: 'customer',
                                amount: counterOffer,
                                message: message,
                                timestamp: new Date()
                            }
                        }
                    },
                    { new: true }
                );
            } else {
                // For accept/reject just use $set
                updatedDesign = await CustomDesign.findByIdAndUpdate(
                    designId,
                    { $set: updates },
                    { new: true }
                );
            }
            console.log("✅ Design request updated successfully");
        } catch (updateError) {
            console.error("❌ Error updating design request:", updateError);
            return NextResponse.json({
                success: false,
                message: 'Error updating design request: ' + updateError.message
            }, { status: 500 });
        }

        // For accepted quotes, add a response message about payment
        if (response === 'accepted') {
            console.log("💰 Accepted quote - customer will be redirected to payment");
        }

        let responseMessage;
        if (response === 'accepted') {
            responseMessage = 'Quote accepted successfully';
        } else if (response === 'rejected') {
            responseMessage = 'Change request submitted successfully';
        } else {
            responseMessage = 'Counter offer submitted successfully';
        }

        return NextResponse.json({
            success: true,
            message: responseMessage,
            designRequest: {
                _id: updatedDesign._id,
                status: updatedDesign.status,
                customerResponse: updatedDesign.customerResponse,
                negotiationHistory: updatedDesign.negotiationHistory || []
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
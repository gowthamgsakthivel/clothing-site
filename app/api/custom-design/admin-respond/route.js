import { NextResponse } from "next/server";
import CustomDesign from "@/models/CustomDesign";
import connectDB from "@/config/db";
import { requireAdmin } from "@/lib/authRoles";

export async function POST(request) {
    console.log("⭐ Starting admin response to negotiation API route");
    try {
        await requireAdmin();

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

        // Parse request body
        const body = await request.json();
        const { designId, response, newQuote, message } = body;

        console.log("📝 Request payload:", {
            designId,
            response,
            newQuote: newQuote || "Not provided",
            message: message ? "Provided" : "Not provided"
        });

        // Validate input
        if (!designId || !response) {
            console.log("❌ Missing required fields");
            return NextResponse.json({
                success: false,
                message: 'Design ID and response are required'
            }, { status: 400 });
        }

        if (!['accept', 'counter', 'reject'].includes(response)) {
            console.log("❌ Invalid response value:", response);
            return NextResponse.json({
                success: false,
                message: 'Response must be "accept", "counter", or "reject"'
            }, { status: 400 });
        }

        // If admin is making a counter offer, new quote amount is required
        if (response === 'counter' && (!newQuote || isNaN(newQuote) || newQuote <= 0)) {
            console.log("❌ Missing or invalid new quote amount");
            return NextResponse.json({
                success: false,
                message: 'New quote amount is required and must be a positive number'
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

        // Verify that the design is in the 'negotiating' status
        if (designRequest.status !== 'negotiating') {
            console.log("❌ Design request is not in negotiating status:", designRequest.status);
            return NextResponse.json({
                success: false,
                message: 'This design request is not in a negotiating state'
            }, { status: 400 });
        }

        // Update the design request based on the admin response
        const updates = {
            updatedAt: new Date()
        };

        if (response === 'accept') {
            // If admin accepts the counter offer, update the quote amount to the last customer offer
            const lastCustomerOffer = designRequest.negotiationHistory
                .filter(n => n.offerBy === 'customer')
                .sort((a, b) => b.timestamp - a.timestamp)[0];

            if (lastCustomerOffer) {
                updates.quote = {
                    amount: lastCustomerOffer.amount,
                    message: message || 'Counter offer accepted',
                    timestamp: new Date()
                };
                updates.status = 'quoted'; // Back to quoted status for customer to approve
            } else {
                return NextResponse.json({
                    success: false,
                    message: 'No customer counter offer found'
                }, { status: 400 });
            }

            // Add admin response message
            updates.adminResponse = {
                message: message || 'We accept your counter offer.',
                timestamp: new Date()
            };
        } else if (response === 'counter') {
            // If admin makes a counter offer, update quote with new amount
            updates.quote = {
                amount: newQuote,
                message: message || `New quote: ${newQuote}`,
                timestamp: new Date()
            };

            // Keep status as negotiating
            updates.status = 'quoted'; // Back to quoted status for customer to respond

            // Add admin response message
            updates.adminResponse = {
                message: message || `We're offering a new price: ${newQuote}`,
                timestamp: new Date()
            };
        } else if (response === 'reject') {
            // If admin rejects the counter offer, keep the original quote
            updates.status = 'quoted'; // Back to quoted status

            // Add admin response message
            updates.adminResponse = {
                message: message || 'We cannot accept your counter offer.',
                timestamp: new Date()
            };
        }

        let updatedDesign;
        try {
            if (response === 'counter') {
                // For counter offer, add to negotiation history
                updatedDesign = await CustomDesign.findByIdAndUpdate(
                    designId,
                    {
                        $set: updates,
                        $push: {
                            negotiationHistory: {
                                offerBy: 'admin',
                                amount: newQuote,
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

        let responseMessage;
        if (response === 'accept') {
            responseMessage = 'Counter offer accepted';
        } else if (response === 'counter') {
            responseMessage = 'New quote submitted';
        } else {
            responseMessage = 'Counter offer rejected';
        }

        return NextResponse.json({
            success: true,
            message: responseMessage,
            designRequest: {
                _id: updatedDesign._id,
                status: updatedDesign.status,
                quote: updatedDesign.quote,
                adminResponse: updatedDesign.adminResponse,
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

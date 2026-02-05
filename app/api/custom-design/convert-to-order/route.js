import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import CustomDesign from "@/models/CustomDesign";
import Order from "@/models/Orders";
import User from "@/models/User";
import Address from "@/models/Address";
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";

export async function POST(request) {
    // console.log("⭐ Starting convert custom design to order API route");
    try {
        // Authenticate user
        const { userId } = getAuth(request);
        // console.log("👤 User auth result:", { userId: userId || "undefined" });

        if (!userId) {
            // console.log("❌ No userId found in auth");
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Check if user is a seller (for logging purposes)
        let isSeller = false;
        try {
            isSeller = await authSeller(userId);
            // console.log("🛡️ User is a seller:", isSeller);
        } catch (authError) {
            console.error("⚠️ Error checking seller status (continuing):", authError);
            // Continue without returning error - we'll check design ownership instead
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

        // Get request body - only parse it once!
        const requestData = await request.json();
        const { designId, paymentMethod, paymentStatus, paymentDetails } = requestData;

        if (!designId) {
            // console.log("❌ Missing design ID");
            return NextResponse.json({
                success: false,
                message: 'Design ID is required'
            }, { status: 400 });
        }

        // Find the design request
        // console.log("🔍 Finding design request with ID:", designId);
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
            // console.log("❌ Design request not found with ID:", designId);
            return NextResponse.json({
                success: false,
                message: 'Design request not found'
            }, { status: 404 });
        }
        // console.log("✅ Found design request");

        // Check if the user is authorized to convert this design to an order
        // User must either be a seller OR the owner of the design
        // console.log("🔒 Auth check - User ID:", userId);
        // console.log("🔒 Auth check - Design owner:", designRequest.user);
        // console.log("🔒 Auth check - Is seller:", isSeller);

        // Fix potential string vs ObjectId comparison issue
        const designOwnerId = String(designRequest.user);
        const currentUserId = String(userId);

        if (!isSeller && designOwnerId !== currentUserId) {
            // console.log("❌ User is not authorized to convert this design to an order");
            return NextResponse.json({
                success: false,
                message: 'Not authorized to convert this design to an order'
            }, { status: 403 });
        }
        // console.log("✅ User is authorized to convert this design to an order");

        // Check if design is approved and has a quote
        if (designRequest.status !== 'approved' || !designRequest.quote || !designRequest.quote.amount) {
            // console.log("❌ Design request is not approved or doesn't have a quote");
            return NextResponse.json({
                success: false,
                message: 'Only approved design requests with quotes can be converted to orders'
            }, { status: 400 });
        }

        // Get user's address
        // console.log("🔍 Finding user's address for user ID:", designRequest.user);
        let userAddress;
        try {
            // Convert to string to ensure consistent comparison
            const userIdString = String(designRequest.user);

            // Try to find any address for this user
            // console.log("Looking for address for user:", userIdString);

            // First try to find the default address
            userAddress = await Address.findOne({
                userId: userIdString,
                isDefault: true
            });

            // If no default address found, fall back to any address for the user
            if (!userAddress) {
                userAddress = await Address.findOne({ userId: userIdString });
            }

            // console.log("Address search result:", userAddress ? `Found (ID: ${userAddress._id})` : "Not found");

            // If no address found but request is from seller, create a placeholder address
            if (!userAddress && isSeller) {
                // console.log("No address found for user, but seller is creating order. Creating placeholder address.");

                // Try to get user details
                const designUser = await User.findById(userIdString);

                // Create a placeholder address for the customer
                userAddress = await Address.create({
                    userId: userIdString,
                    fullName: designUser?.name || "Customer",
                    phoneNumber: designRequest.phone || "0000000000",
                    pincode: 100000, // Placeholder
                    area: "Address to be confirmed",
                    city: "City",
                    state: "State",
                    isDefault: true
                });

                // console.log("Created placeholder address:", userAddress._id);
            }
            // For customer-initiated requests, they must have an address
            else if (!userAddress) {
                // console.log("❌ No address found for user");
                return NextResponse.json({
                    success: false,
                    message: 'No address found. Please add an address in your profile before completing the order.'
                }, { status: 404 });
            }

            // console.log("✅ Using address:", userAddress._id);
        } catch (addressError) {
            console.error("❌ Error finding/creating address:", addressError);
            console.error("Error details:", addressError.message, addressError.stack);
            return NextResponse.json({
                success: false,
                message: 'Error with shipping address: ' + addressError.message
            }, { status: 500 });
        }

        // Create a new order for the custom design
        // console.log("📦 Creating new order for custom design");
        // console.log("Order details:", {
        //     userId: designRequest.user,
        //     designId: designRequest._id,
        //     quantity: designRequest.quantity,
        //     size: designRequest.size,
        //     color: designRequest.preferredColor || "N/A",
        //     amount: designRequest.quote.amount,
        //     addressId: userAddress._id,
        //     paymentMethod: paymentMethod || 'COD',
        //     paymentStatus: paymentStatus || 'Pending',
        // });

        let newOrder;
        try {
            // Create order object
            const orderData = {
                userId: String(designRequest.user),
                items: [{
                    product: "Custom Design: " + designRequest.description,
                    quantity: designRequest.quantity,
                    size: designRequest.size,
                    color: designRequest.preferredColor || "N/A",
                    // Set custom design flag and reference
                    isCustomDesign: true,
                    customDesignId: designRequest._id,
                    customDesignImage: designRequest.designImage
                }],
                amount: designRequest.quote.amount,
                address: userAddress._id,
                status: 'Order Placed',
                paymentMethod: paymentMethod || 'COD',  // Use provided payment method or default to COD
                paymentStatus: paymentStatus || 'Pending',
                date: Math.floor(Date.now() / 1000),  // Use seconds format for consistency
                paymentDetails: paymentDetails || null // Store payment details if provided
            };

            // console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
            newOrder = await Order.create(orderData);
            // console.log("✅ Order created successfully:", newOrder._id);
        } catch (orderError) {
            console.error("❌ Error creating order:", orderError);
            console.error("Error details:", orderError.message, orderError.stack);
            return NextResponse.json({
                success: false,
                message: 'Error creating order: ' + orderError.message
            }, { status: 500 });
        }

        // Update design request status to completed
        // console.log("📝 Updating design request status to completed");
        try {
            designRequest.status = 'completed';
            designRequest.orderId = newOrder._id;  // Link to the created order
            designRequest.updatedAt = new Date();
            await designRequest.save();
            // console.log("✅ Design request updated to completed");
        } catch (updateError) {
            console.error("❌ Error updating design request:", updateError);
            // Don't return error here, as the order is already created
            // Just log the error and continue
        }

        return NextResponse.json({
            success: true,
            message: 'Custom design converted to order successfully',
            order: {
                _id: newOrder._id,
                status: newOrder.status
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
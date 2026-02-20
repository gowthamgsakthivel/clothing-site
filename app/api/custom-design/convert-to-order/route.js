import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authRoles";
import CustomDesign from "@/models/CustomDesign";
import User from "@/models/User";
import Address from "@/models/Address";
import connectDB from "@/config/db";
import { createOrder } from "@/services/orders/OrderService";

export async function POST(request) {
    // console.log("⭐ Starting convert custom design to order API route");
    try {
        // Authenticate user
        const { userId, role } = await requireUser({ allowAdmin: true });
        // console.log("👤 User auth result:", { userId: userId || "undefined" });

        if (!userId) {
            // console.log("❌ No userId found in auth");
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        const isAdmin = role === 'admin';

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
        // User must either be an admin or the owner of the design
        // console.log("🔒 Auth check - User ID:", userId);
        // console.log("🔒 Auth check - Design owner:", designRequest.user);
        // console.log("🔒 Auth check - Is admin:", isAdmin);

        // Fix potential string vs ObjectId comparison issue
        const designOwnerId = String(designRequest.user);
        const currentUserId = String(userId);

        if (!isAdmin && designOwnerId !== currentUserId) {
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

            // If no address found but request is from admin, create a placeholder address
            if (!userAddress && isAdmin) {
                // console.log("No address found for user, but admin is creating order. Creating placeholder address.");

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
            const quantity = Number(designRequest.quantity || 1);
            const totalPrice = Number(designRequest.quote.amount || 0);
            const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;

            const orderData = {
                userId: String(designRequest.user),
                items: [{
                    sku: `custom_${designRequest._id}`,
                    quantity,
                    unitPrice,
                    totalPrice,
                    isCustomDesign: true,
                    customDesignId: designRequest._id,
                    designName: designRequest.designName || designRequest.description || 'Custom Design',
                    customDesignImage: designRequest.designImage,
                    size: designRequest.size,
                    color: designRequest.preferredColor || null
                }],
                paymentMethod: paymentMethod || 'COD',
                paymentStatus: paymentStatus || 'Pending',
                shippingAddressId: userAddress._id,
                taxTotal: 0,
                shippingTotal: 0,
                discountTotal: 0,
                grandTotal: totalPrice
            };

            const result = await createOrder(orderData);
            newOrder = result?.order;
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
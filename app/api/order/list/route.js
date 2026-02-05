import connectDB from "@/config/db";
import Address from "@/models/Address";
import Order from "@/models/Orders";
import Product from "@/models/Product";
import CustomDesign from "@/models/CustomDesign";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    console.log("⭐ Starting order list API route");
    try {
        // Try to get userId from Clerk auth (from cookies/session)
        let userId = null;

        try {
            const auth = await getAuth(request);
            userId = auth.userId;
            console.log("👤 Auth from Clerk:", { userId: userId || "undefined" });
        } catch (authError) {
            console.warn("⚠️ Clerk auth failed:", authError.message);
        }

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

        // Ensure models are loaded
        Address.length;
        Product.length;
        CustomDesign.length;

        console.log("🔍 Finding orders for user:", userId);
        let orders;
        try {
            // First, find all orders without populating the product field
            // Make sure we're sorting by date in descending order (most recent first)
            orders = await Order.find({ userId })
                .populate("address")
                .sort({ date: -1 }) // -1 means descending order (most recent first)
                .lean();

            console.log(`Found ${orders.length} orders, processing product references...`);

            // Get all product IDs that need to be populated (string or ObjectId)
            const productIds = [];
            orders.forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (item.product && !item.isCustomDesign) {
                            const productId = typeof item.product === 'string'
                                ? item.product
                                : item.product.toString?.();

                            if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
                                productIds.push(productId);
                            }
                        }
                    });
                }
            });

            console.log(`Found ${productIds.length} product IDs to populate`);

            // If we have product IDs to populate, fetch them separately
            let productMap = {};
            if (productIds.length > 0) {
                const products = await Product.find({
                    _id: { $in: productIds }
                }).lean();

                // Create a map for efficient lookups
                products.forEach(product => {
                    productMap[product._id.toString()] = product;
                });

                console.log(`Fetched ${Object.keys(productMap).length} products for population`);
            }

            // Process orders to ensure address is properly formatted and manually populate products
            orders = orders.map(order => {
                try {
                    // If address wasn't populated (just ID string), handle gracefully
                    if (!order.address || typeof order.address === 'string') {
                        console.log(`⚠️ Address not populated for order ${order._id}. Using placeholder.`);
                        order.address = {
                            fullName: "Customer",
                            area: "Address to be confirmed",
                            city: "",
                            state: "",
                            phoneNumber: ""
                        };
                    }

                    // Ensure items is always an array
                    if (!Array.isArray(order.items)) {
                        console.log(`⚠️ Items not properly defined for order ${order._id}. Fixing.`);
                        order.items = [];
                    } else {
                        // Process each item in the order
                        order.items = order.items.map(item => {
                            try {
                                // If this is a custom design, keep product as string
                                if (item.isCustomDesign) {
                                    return {
                                        ...item,
                                        product: typeof item.product === 'string' ? item.product : 'Custom Design'
                                    };
                                }

                                // If it's a regular product with an ObjectId or string reference
                                const productId = typeof item.product === 'string'
                                    ? item.product
                                    : item.product?.toString?.();

                                if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
                                    const productData = productMap[productId];
                                    if (productData) {
                                        return {
                                            ...item,
                                            product: productData
                                        };
                                    }
                                }

                                // If we can't populate, return as is
                                return item;
                            } catch (itemErr) {
                                console.error(`Error processing item in order ${order._id}:`, itemErr);
                                return item; // Return item unchanged if there's an error
                            }
                        });
                    }

                    // Make sure all required fields exist
                    if (!order.amount) order.amount = 0;
                    if (!order.paymentStatus) order.paymentStatus = 'Pending';
                    if (!order.paymentMethod) order.paymentMethod = 'COD';
                    if (!order.date) order.date = Math.floor(Date.now() / 1000);

                    return order;
                } catch (err) {
                    console.error(`Error processing order ${order?._id}:`, err);
                    // Return a minimal valid order object
                    return {
                        _id: order?._id || 'unknown',
                        items: [],
                        amount: 0,
                        address: {
                            fullName: "Customer",
                            area: "Error loading address",
                            city: "",
                            state: "",
                            phoneNumber: ""
                        },
                        status: 'Error',
                        paymentMethod: 'Unknown',
                        paymentStatus: 'Unknown',
                        date: Math.floor(Date.now() / 1000)
                    };
                }
            });

            console.log(`✅ Found ${orders.length} orders`);

            // If order contains custom designs, fetch and attach the custom design information
            const customDesignIds = [];
            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.isCustomDesign && item.customDesignId) {
                        customDesignIds.push(item.customDesignId);
                    }
                });
            });

            // If we have custom design orders, fetch their details
            if (customDesignIds.length > 0) {
                console.log(`🔍 Finding details for ${customDesignIds.length} custom designs`);
                const customDesigns = await CustomDesign.find({
                    _id: { $in: customDesignIds }
                }).lean();

                console.log(`✅ Found ${customDesigns.length} custom design details`);

                // Create a map for easy lookup
                const customDesignMap = {};
                customDesigns.forEach(design => {
                    customDesignMap[design._id.toString()] = design;
                });

                // Enhance order items with custom design details
                orders = orders.map(order => {
                    const items = order.items.map(item => {
                        if (item.isCustomDesign && item.customDesignId) {
                            try {
                                const designId = item.customDesignId.toString();
                                const design = customDesignMap[designId];

                                if (design) {
                                    return {
                                        ...item,
                                        customDesignDetails: {
                                            description: design.description,
                                            size: design.size,
                                            preferredColor: design.preferredColor,
                                            additionalNotes: design.additionalNotes
                                        }
                                    };
                                }
                            } catch (designErr) {
                                console.error(`Error processing custom design for item in order:`, designErr);
                                // Continue with the original item without adding details
                            }
                        }
                        return item;
                    });

                    return { ...order, items };
                });
            }
        } catch (orderError) {
            console.error("❌ Error finding orders:", orderError);
            return NextResponse.json({
                success: false,
                message: 'Error finding orders: ' + orderError.message
            }, { status: 500 });
        }

        // Final validation to ensure we're not returning any problematic data
        const safeOrders = orders.map(order => {
            try {
                // Check for any remaining issues in order data structure
                return {
                    ...order,
                    // Ensure items is always an array even after processing
                    items: Array.isArray(order.items) ? order.items : []
                };
            } catch (err) {
                console.error(`Error in final order validation for ${order?._id}:`, err);
                return {
                    _id: order?._id || 'unknown',
                    items: [],
                    amount: 0,
                    address: {
                        fullName: "Customer",
                        area: "Error loading order data",
                        city: "",
                        state: "",
                        phoneNumber: ""
                    },
                    status: 'Error',
                    paymentMethod: 'Unknown',
                    paymentStatus: 'Unknown',
                    date: Math.floor(Date.now() / 1000)
                };
            }
        });

        console.log(`✅ Successfully processed ${safeOrders.length} orders. Returning to client.`);
        return NextResponse.json({
            success: true,
            orders: safeOrders
        });

    } catch (error) {
        console.error("❌ Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}
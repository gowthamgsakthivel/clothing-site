import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Address from "@/models/Address";
import Order from "@/models/Orders";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";




export async function GET(request) {
    console.log("⭐ Starting seller orders API route");
    try {
        const { userId } = getAuth(request);
        console.log("👤 Seller auth check for user:", userId);

        if (!userId) {
            console.log("❌ No userId found in auth");
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Check if user is a seller
        const isSeller = await authSeller(userId);
        console.log("🛡️ User is a seller:", isSeller);

        if (!isSeller) {
            console.log("❌ User is not authorized as a seller");
            return NextResponse.json({
                success: false,
                message: 'Not authorized. Seller access required.'
            }, { status: 403 });
        }

        console.log("🔌 Connecting to database...");
        await connectDB();
        console.log("✅ Connected to database");

        // Make sure models are loaded
        Address.length;

        console.log("🔍 Finding orders related to this seller");

        try {
            // Step 1: Find all products that belong to this seller
            const sellerProducts = await Product.find({ userId: userId })
                .select('_id')
                .lean();

            const sellerProductIds = sellerProducts.map(p => p._id.toString());
            console.log(`Found ${sellerProductIds.length} products belonging to seller ${userId}`);

            // Step 2: For seller dashboard, show only regular product orders (not custom designs)
            // Custom designs are handled separately in the custom-designs section
            let orders = await Order.find({
                "items.isCustomDesign": { $ne: true } // Exclude custom design orders
            })
                .sort({ date: -1 })
                .lean();

            console.log(`Found ${orders.length} regular product orders for seller dashboard`);

            // Get all product IDs that need to be populated (filtering out string products)
            const productIds = [];
            orders.forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        // Only collect IDs that look like MongoDB ObjectIds (24 hex chars)
                        if (item.product && !item.isCustomDesign &&
                            typeof item.product === 'string' &&
                            /^[0-9a-fA-F]{24}$/.test(item.product)) {
                            productIds.push(item.product);
                        }
                    });
                }
            });

            console.log(`Found ${productIds.length} product IDs to populate`);

            // If we have product IDs to populate, fetch them separately
            let productMap = {};
            if (productIds.length > 0) {
                // Product model is already imported at the top
                const products = await Product.find({
                    _id: { $in: productIds }
                }).lean();

                // Create a map for efficient lookups
                products.forEach(product => {
                    productMap[product._id.toString()] = product;
                });

                console.log(`Fetched ${Object.keys(productMap).length} products for population`);
            }

            // Process orders and manually populate products
            const processedOrders = await Promise.all(orders.map(async (order) => {
                try {
                    // Check and normalize the date field to Unix timestamp in seconds
                    if (order.date) {
                        if (typeof order.date === 'number') {
                            // If it's a large number (> year 2001), it's likely in milliseconds
                            if (order.date > 1000000000000) {
                                order.date = Math.floor(order.date / 1000);
                            }
                            // If it's already in seconds, keep it as is
                        } else {
                            // Try to convert string date to timestamp
                            try {
                                const dateObj = new Date(order.date);
                                if (!isNaN(dateObj.getTime())) {
                                    order.date = Math.floor(dateObj.getTime() / 1000);
                                } else {
                                    order.date = Math.floor(Date.now() / 1000); // Use current time as fallback
                                }
                            } catch (dateErr) {
                                order.date = Math.floor(Date.now() / 1000); // Use current time as fallback
                            }
                        }
                    } else {
                        order.date = Math.floor(Date.now() / 1000);
                    }

                    // Handle address - fetch separately if needed
                    if (order.address && typeof order.address === 'string') {
                        try {
                            const addressDoc = await Address.findById(order.address).lean();
                            order.address = addressDoc || {
                                fullName: "Customer",
                                area: "Address not available",
                                city: "",
                                state: "",
                                phoneNumber: ""
                            };
                        } catch (addressErr) {
                            console.log(`⚠️ Could not fetch address ${order.address}:`, addressErr.message);
                            order.address = {
                                fullName: "Customer",
                                area: "Address not available",
                                city: "",
                                state: "",
                                phoneNumber: ""
                            };
                        }
                    } else if (!order.address) {
                        console.log(`⚠️ No address for order ${order._id}. Using placeholder.`);
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

                                // If it's a regular product with an ObjectId reference
                                if (item.product && typeof item.product === 'string' &&
                                    /^[0-9a-fA-F]{24}$/.test(item.product)) {

                                    // Look up in our product map
                                    const productData = productMap[item.product];
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

                    return order;
                } catch (err) {
                    console.error(`Error processing order ${order?._id}:`, err);
                    return order; // Return order unchanged if there's an error
                }
            }));

            console.log(`✅ Successfully processed ${processedOrders.length} orders for seller view`);

            // Sort orders by date in descending order (newest first) after processing
            processedOrders.sort((a, b) => {
                const dateA = typeof a.date === 'number' ? a.date : 0;
                const dateB = typeof b.date === 'number' ? b.date : 0;
                return dateB - dateA; // Descending order (newest first)
            });

            console.log(`Orders sorted by date. Newest order: ${new Date(processedOrders[0]?.date * 1000).toISOString()}`);

            return NextResponse.json({ success: true, orders: processedOrders });
        } catch (orderError) {
            console.error("❌ Error finding or processing orders:", orderError);
            return NextResponse.json({
                success: false,
                message: `Error finding orders: ${orderError.message}`
            }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }

}
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

        console.log("🔍 Finding all orders for seller view");

        try {
            // First, find all orders without populating the product field
            let orders = await Order.find({})
                .populate("address")
                .sort({ date: -1 })
                .lean();

            console.log(`Found ${orders.length} orders, processing product references...`);

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
            orders = orders.map(order => {
                try {
                    // Check and normalize the date field
                    if (order.date) {
                        // Make sure date is always a Unix timestamp in seconds
                        if (typeof order.date === 'number') {
                            console.log(`Order ${order._id}: Date is already a number:`, order.date);
                            // Ensure it's in seconds, not milliseconds (timestamps over year 2001 are likely in milliseconds)
                            if (order.date > 4000000000) {
                                order.date = Math.floor(order.date / 1000);
                                console.log(`Order ${order._id}: Converted date from ms to seconds:`, order.date);
                            }
                        } else {
                            // Try to convert to a timestamp
                            try {
                                const dateObj = new Date(order.date);
                                order.date = Math.floor(dateObj.getTime() / 1000);
                                console.log(`Order ${order._id}: Converted string date to seconds:`, order.date);
                            } catch (dateErr) {
                                console.error(`Order ${order._id}: Invalid date format:`, order.date);
                                order.date = Math.floor(Date.now() / 1000); // Use current time as fallback
                            }
                        }
                    } else {
                        console.log(`Order ${order._id}: No date field, using current time`);
                        order.date = Math.floor(Date.now() / 1000);
                    }

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
            });

            console.log(`✅ Successfully processed ${orders.length} orders for seller view`);
            return NextResponse.json({ success: true, orders });
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
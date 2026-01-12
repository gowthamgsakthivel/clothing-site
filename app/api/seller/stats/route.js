import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import Order from "@/models/Orders";

export async function GET(request) {
    console.log("⭐ Starting seller stats API route");
    try {
        // Authenticate user
        let userId;
        try {
            const auth = getAuth(request);
            userId = auth.userId;
            console.log("👤 User auth result:", { userId: userId || "undefined" });
        } catch (authError) {
            console.error("❌ Error with authentication:", authError);
            return NextResponse.json({
                success: false,
                message: 'Authentication error: ' + authError.message
            }, { status: 401 });
        }

        if (!userId) {
            console.log("❌ No userId found in auth");
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Check if user is a seller
        console.log("🛡️ Checking if user is a seller");
        try {
            const isSeller = await authSeller(userId);
            if (!isSeller) {
                console.log("❌ User is not authorized as seller");
                return NextResponse.json({
                    success: false,
                    message: 'Not authorized as seller'
                }, { status: 403 });
            }
            console.log("✅ User is confirmed as seller");
        } catch (authError) {
            console.error("❌ Error checking seller status:", authError);
            return NextResponse.json({
                success: false,
                message: 'Error checking seller status: ' + authError.message
            }, { status: 500 });
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

        // Get seller's products
        console.log(`📦 Fetching products for seller: ${userId}`);
        const products = await Product.find({ userId }).lean();
        console.log(`Found ${products.length} products`);

        // Calculate inventory stats
        let totalProducts = products.length;
        let totalStock = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        products.forEach(product => {
            // Get total stock from inventory array
            if (product.inventory && Array.isArray(product.inventory)) {
                product.inventory.forEach(colorItem => {
                    if (colorItem.sizeStock && Array.isArray(colorItem.sizeStock)) {
                        colorItem.sizeStock.forEach(sizeItem => {
                            const quantity = sizeItem.quantity || 0;
                            totalStock += quantity;

                            const threshold = sizeItem.lowStockThreshold || product.stockSettings?.globalLowStockThreshold || 10;

                            if (quantity === 0) {
                                outOfStockCount++;
                            } else if (quantity <= threshold) {
                                lowStockCount++;
                            }
                        });
                    }
                });
            }
            // Fallback for legacy stock field
            else if (product.stock) {
                totalStock += product.stock;
                const threshold = product.stockSettings?.globalLowStockThreshold || 10;
                if (product.stock === 0) {
                    outOfStockCount++;
                } else if (product.stock <= threshold) {
                    lowStockCount++;
                }
            }
        });

        // Get seller's orders
        console.log(`📋 Fetching orders for seller: ${userId}`);
        const sellerOrders = await Order.find({ userId }).lean();
        console.log(`Found ${sellerOrders.length} orders`);

        // Calculate order stats by status
        let pendingOrders = 0;
        let inTransitOrders = 0;
        let deliveredOrders = 0;

        sellerOrders.forEach(order => {
            const status = order.status?.toLowerCase() || '';
            if (status === 'order placed' || status === 'processing' || status === 'pending') {
                pendingOrders++;
            } else if (status === 'shipped' || status === 'in transit' || status === 'out for delivery') {
                inTransitOrders++;
            } else if (status === 'delivered' || status === 'completed') {
                deliveredOrders++;
            }
        });

        const stats = {
            // Inventory stats
            totalProducts,
            totalStock,
            lowStockCount,
            outOfStockCount,
            // Order stats
            pendingOrders,
            inTransitOrders,
            deliveredOrders,
            totalOrders: sellerOrders.length
        };

        console.log("📊 Calculated stats:", stats);

        return NextResponse.json({
            success: true,
            stats,
            message: 'Stats fetched successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching seller stats:', error);
        return NextResponse.json({
            success: false,
            message: 'Error fetching seller stats: ' + error.message
        }, { status: 500 });
    }
}

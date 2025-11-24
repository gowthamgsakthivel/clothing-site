import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Order from "@/models/Orders";
import CustomDesign from "@/models/CustomDesign";
import authSeller from "@/lib/authSeller";

// This is a simplified version of the analytics API route for debugging
export async function GET(request) {
    console.log("⭐ Starting analytics debug API route");
    try {
        // Auth info
        let userId;
        let authInfo = { success: false, message: "Auth not attempted" };

        try {
            const auth = getAuth(request);
            userId = auth?.userId;
            //console.log("👤 Auth result:", { userId: userId || "undefined" });

            if (userId) {
                try {
                    const isSeller = await authSeller(userId);
                    authInfo = {
                        success: true,
                        userId,
                        isSeller,
                        message: isSeller ? "Authenticated as seller" : "Not a seller"
                    };
                } catch (sellerError) {
                    authInfo = {
                        success: false,
                        userId,
                        error: sellerError.message,
                        message: "Error checking seller status"
                    };
                }
            } else {
                authInfo = {
                    success: false,
                    message: "No userId found in auth"
                };
            }
        } catch (authError) {
            authInfo = {
                success: false,
                error: authError.message,
                message: "Authentication error"
            };
        }

        // Connect to database
        console.log("🔌 Connecting to database...");
        let dbInfo = { success: false, message: "Database connection not attempted" };

        try {
            await connectDB();
            console.log("✅ Connected to database");
            dbInfo = { success: true, message: "Database connected successfully" };
        } catch (dbError) {
            console.error("❌ Database connection failed:", dbError);
            dbInfo = {
                success: false,
                error: dbError.message,
                message: "Database connection failed"
            };
            return NextResponse.json({
                success: false,
                message: 'Database connection failed: ' + dbError.message,
                authInfo,
                dbInfo
            }, { status: 500 });
        }

        // Simple counts
        let regularOrderCount = 0;
        let customDesignCount = 0;

        try {
            regularOrderCount = await Order.countDocuments({});
            console.log("Regular orders count:", regularOrderCount);
        } catch (error) {
            console.error("Error counting regular orders:", error);
        }

        try {
            customDesignCount = await CustomDesign.countDocuments({});
            console.log("Custom designs count:", customDesignCount);
        } catch (error) {
            console.error("Error counting custom designs:", error);
        }

        // Sample documents
        let sampleOrder = null;
        let sampleCustomDesign = null;

        try {
            sampleOrder = await Order.findOne({}).lean();
            // For security reasons, limit what we return
            if (sampleOrder) {
                sampleOrder = {
                    _id: sampleOrder._id,
                    status: sampleOrder.status,
                    date: sampleOrder.date,
                    amount: sampleOrder.amount,
                    dateType: typeof sampleOrder.date
                };
            }
        } catch (error) {
            console.error("Error fetching sample order:", error);
        }

        try {
            sampleCustomDesign = await CustomDesign.findOne({}).lean();
            // For security reasons, limit what we return
            if (sampleCustomDesign) {
                sampleCustomDesign = {
                    _id: sampleCustomDesign._id,
                    status: sampleCustomDesign.status,
                    createdAt: sampleCustomDesign.createdAt,
                    createdAtType: typeof sampleCustomDesign.createdAt,
                    quote: sampleCustomDesign.quote ? {
                        amount: sampleCustomDesign.quote.amount,
                        amountType: typeof sampleCustomDesign.quote.amount
                    } : null
                };
            }
        } catch (error) {
            console.error("Error fetching sample custom design:", error);
        }

        // Test Clerk connection
        let clerkStatus = { success: false, message: "Clerk test not attempted" };
        if (userId) {
            try {
                const { clerkClient } = await import('@clerk/nextjs/server');
                const client = await clerkClient();
                const userInfo = await client.users.getUser(userId);
                clerkStatus = {
                    success: true,
                    message: "Clerk connection successful",
                    userMetadata: userInfo?.publicMetadata || null
                };
            } catch (clerkError) {
                clerkStatus = {
                    success: false,
                    message: "Clerk connection error",
                    error: clerkError.message
                };
            }
        }

        // Test date handling
        let dateTests = {};
        try {
            const now = new Date();
            const timestamp = Math.floor(now.getTime() / 1000);
            const convertedBack = new Date(timestamp * 1000);

            dateTests = {
                success: true,
                jsDateNow: now.toISOString(),
                unixTimestamp: timestamp,
                convertedBackToDate: convertedBack.toISOString()
            };
        } catch (dateError) {
            dateTests = {
                success: false,
                error: dateError.message
            };
        }

        // Return debug information
        return NextResponse.json({
            success: true,
            debug: {
                auth: authInfo,
                db: dbInfo,
                clerk: clerkStatus,
                dateTests,
                counts: {
                    regularOrders: regularOrderCount,
                    customDesigns: customDesignCount
                },
                samples: {
                    order: sampleOrder,
                    customDesign: sampleCustomDesign
                },
                timestamp: new Date().toISOString(),
                nodeVersion: process.version,
                env: {
                    NODE_ENV: process.env.NODE_ENV
                }
            }
        });
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}
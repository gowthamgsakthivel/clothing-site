import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { getCachedResponse } from "@/lib/apiCache";
import { measureApiPerformance } from "@/lib/apiMonitoring";

// Wrap the handler with performance monitoring
const handler = async (request) => {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            console.log("No userId in authentication");
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user is a seller
        try {
            const isSeller = await authSeller(userId);

            if (!isSeller) {
                return NextResponse.json(
                    { success: false, message: 'Not authorized as seller' },
                    { status: 403 }
                );
            }
        } catch (authError) {
            console.error("Seller auth error:", authError);
            return NextResponse.json(
                { success: false, message: 'Authentication error: ' + authError.message },
                { status: 500 }
            );
        }

        // Generate a cache key specific to this seller
        const cacheKey = `seller-products:${userId}`;

        // Use caching with a shorter TTL for seller data (2 minutes)
        // Seller needs fresher data than customers
        const responseData = await getCachedResponse(
            cacheKey,
            async () => {
                console.log(`[DB Query] Fetching products for seller: ${userId}`);

                await connectDB();

                // Use projection to select only needed fields and lean() for performance
                // Note: Changed sellerId to userId to match schema
                const products = await Product.find(
                    { userId: userId },
                    'name image price offerPrice color sizes stock category ratings createdAt'
                ).lean();

                return { success: true, products };
            },
            120 // Cache for 2 minutes (120 seconds)
        );

        // Add performance headers
        const response = NextResponse.json(responseData);
        response.headers.set('X-Cache-Status', responseData._fromCache ? 'HIT' : 'MISS');

        return response;
    } catch (error) {
        console.error(`[API Error] Seller Products: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);

        // For debugging purposes, include detailed error information
        const isDevEnvironment = process.env.NODE_ENV === 'development';

        return NextResponse.json(
            {
                success: false,
                message: error.message,
                ...(isDevEnvironment && { stack: error.stack })
            },
            { status: 500 }
        );
    }
};

// Export the monitored handler
export const GET = measureApiPerformance('/api/product/seller-list', handler);
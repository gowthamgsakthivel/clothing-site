import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function GET(request) {
    try {
        console.log("⭐ Starting seller products API route");

        // Authenticate user
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        await connectDB();

        // Get query parameters for pagination and filtering
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';

        const skip = (page - 1) * limit;

        // Build query
        const query = { userId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        // Fetch products with pagination
        const [products, totalProducts] = await Promise.all([
            Product.find(query)
                .select('name description price offerPrice image category genderCategory brand inventory totalStock availableColors availableSizes stockSettings date')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(query)
        ]);

        console.log(`✅ Found ${products.length} products for seller: ${userId}`);

        return NextResponse.json({
            success: true,
            products,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProducts / limit),
                totalProducts,
                hasNextPage: page < Math.ceil(totalProducts / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error("❌ Error fetching seller products:", error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch products: ' + error.message
        }, { status: 500 });
    }
}
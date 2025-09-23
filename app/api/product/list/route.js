import Product from "@/models/Product";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        await connectDB();

        // Get total count for pagination info
        const totalProducts = await Product.countDocuments({});
        const totalPages = Math.ceil(totalProducts / limit);

        // Get paginated products
        const products = await Product.find({})
            .sort({ date: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            success: true,
            products,
            pagination: {
                total: totalProducts,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}

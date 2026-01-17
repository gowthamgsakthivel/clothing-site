import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

// ✅ PRODUCTION FIX 3: Rate limiting for search endpoint
const limiter = rateLimit({ limit: 120, window: 60 }); // 120 requests per minute

export async function GET(request) {
    try {
        // ✅ Rate limit check
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'anonymous';

        const { success, remaining } = await limiter.limit(ip);

        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': '60'
                    }
                }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // ✅ Cap at 50
        const category = searchParams.get('category');
        const gender = searchParams.get('gender');
        const minPrice = Math.max(0, parseFloat(searchParams.get('minPrice') || '0'));
        const maxPrice = Math.min(parseFloat(searchParams.get('maxPrice') || '1000000'), 1000000);
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        await connectDB();

        // Build the filter object
        const filter = {
            offerPrice: { $gte: minPrice, $lte: maxPrice }
        };

        // Add text search if query exists
        if (query && query.trim() !== '') {
            // ✅ Use text search (more efficient than regex for full search)
            try {
                await Product.collection.createIndex({
                    name: "text",
                    description: "text",
                    brand: "text",
                    category: "text"
                }, { background: true });
            } catch (error) {
                // Index might already exist
                if (process.env.NODE_ENV === 'development') {
                    console.log("Index creation:", error.message);
                }
            }

            filter.$text = { $search: query };
        }

        // Add category filter if provided
        if (category) {
            filter.category = category;
        }

        // Add gender filter if provided
        if (gender) {
            filter.gender = gender;
        }

        // Count total products matching the filter (with timeout)
        const totalProducts = await Product.countDocuments(filter).maxTimeMS(5000);

        // Calculate pagination
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalProducts / limit);

        // Create sort object
        const sort = {};

        // ✅ Optimize sorting
        if (sortBy === 'price') {
            sort.offerPrice = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'name') {
            sort.name = sortOrder === 'asc' ? 1 : -1;
        } else {
            sort.createdAt = sortOrder === 'asc' ? 1 : -1;
        }

        // Get products with optimizations
        let products;
        if (query && query.trim() !== '') {
            products = await Product.find(
                filter,
                { score: { $meta: "textScore" } } // Include text score
            )
                .sort({ score: { $meta: "textScore" }, ...sort })
                .skip(skip)
                .limit(limit)
                .select('name image offerPrice price category brand slug description') // ✅ Limited fields
                .lean()
                .maxTimeMS(10000); // ✅ 10 second timeout
        } else {
            products = await Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('name image offerPrice price category brand slug description') // ✅ Limited fields
                .lean()
                .maxTimeMS(10000); // ✅ 10 second timeout
        }

        // Return response with products
        return NextResponse.json({
            success: true,
            products: products,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalResults: totalProducts,
                hasMore: page < totalPages
            },
            filters: {
                appliedFilters: {
                    query,
                    category,
                    gender,
                    minPrice,
                    maxPrice,
                    sortBy,
                    sortOrder
                }
            }
        }, {
            headers: {
                'X-RateLimit-Remaining': remaining.toString()
            }
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to search products",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
        }, { status: 500 });
    }
}
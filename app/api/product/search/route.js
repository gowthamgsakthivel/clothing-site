import connectDB from "@/config/db";
import ProductV2 from "@/models/v2/Product";
import Inventory from "@/models/v2/Inventory";
import { mapV2ProductToLegacy } from "@/lib/v2ProductMapper";
import { NextResponse } from "next/server";
import { rateLimit, escapeRegex } from "@/lib/rateLimit";

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
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const category = searchParams.get('category');
        const gender = searchParams.get('gender');
        const minPrice = Math.max(0, parseFloat(searchParams.get('minPrice') || '0'));
        const maxPrice = Math.min(parseFloat(searchParams.get('maxPrice') || '1000000'), 1000000);
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        await connectDB();

        const filter = { status: 'active' };
        if (category) {
            filter.category = category;
        }
        if (gender) {
            filter.genderCategory = gender;
        }
        if (query && query.trim() !== '') {
            const safeQuery = escapeRegex(query.trim());
            const regex = new RegExp(safeQuery, 'i');
            filter.$or = [
                { name: regex },
                { description: regex },
                { brand: regex },
                { category: regex }
            ];
        }

        const safeOrder = sortOrder === 'asc' ? 1 : -1;
        const sort = sortBy === 'price'
            ? { minOfferPrice: safeOrder }
            : sortBy === 'name'
                ? { name: safeOrder }
                : { createdAt: safeOrder };

        const skip = (page - 1) * limit;

        const [result] = await ProductV2.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'product_variants_v2',
                    let: { productId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$productId', '$$productId'] } } },
                        { $match: { visibility: { $ne: 'hidden' } } }
                    ],
                    as: 'variants'
                }
            },
            {
                $addFields: {
                    minOfferPrice: { $min: '$variants.offerPrice' }
                }
            },
            {
                $match: {
                    minOfferPrice: { $gte: minPrice, $lte: maxPrice }
                }
            },
            { $sort: sort },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    total: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const productsRaw = result?.data || [];
        const totalProducts = result?.total?.[0]?.count || 0;
        const totalPages = Math.ceil(totalProducts / limit);

        const variants = productsRaw.flatMap((product) => product.variants || []);
        const variantIds = variants.map((variant) => variant._id);
        const inventories = variantIds.length
            ? await Inventory.find({ variantId: { $in: variantIds } }).lean()
            : [];

        const inventoryByVariantId = new Map();
        inventories.forEach((inventory) => {
            inventoryByVariantId.set(String(inventory.variantId), inventory);
        });

        const products = productsRaw.map((product) => mapV2ProductToLegacy({
            product,
            variants: product.variants || [],
            inventoryByVariantId
        }));

        return NextResponse.json({
            success: true,
            products,
            pagination: {
                currentPage: page,
                totalPages,
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
import connectDB from "@/config/db";
import ProductV2 from "@/models/v2/Product";
import Inventory from "@/models/v2/Inventory";
import { buildInventoryByVariantId } from "@/lib/v2ProductView";
import { NextResponse } from "next/server";
import { rateLimit, escapeRegex } from "@/lib/rateLimit";

// ✅ PRODUCTION FIX 3: Rate limiting for search endpoint
const limiter = rateLimit({ limit: 120, window: 60 }); // 120 requests per minute

const normalizeToken = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const buildNormalizedFieldExpr = (field) => ({
    $replaceAll: {
        input: {
            $toLower: {
                $trim: { input: `$${field}` }
            }
        },
        find: ' ',
        replacement: ''
    }
});

const tokenizeQuery = (value) => {
    const normalized = normalizeToken(value);
    const parts = normalized.split(' ').filter((part) => part.length >= 3);
    return Array.from(new Set(parts));
};

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
        // Support multiple categories/genders via comma-separated values
        const categoryParam = searchParams.get('category');
        const genderParam = searchParams.get('gender');
        const category = categoryParam ? categoryParam.split(',').map(normalizeToken).filter(Boolean) : [];
        const gender = genderParam ? genderParam.split(',').map(normalizeToken).filter(Boolean) : [];
        const minPrice = Math.max(0, parseFloat(searchParams.get('minPrice') || '0'));
        const maxPrice = Math.min(parseFloat(searchParams.get('maxPrice') || '1000000'), 1000000);
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        await connectDB();

        const filter = { status: 'active' };
        const andConditions = [];
        if (category && category.length > 0) {
            andConditions.push({
                $expr: {
                    $in: [
                        buildNormalizedFieldExpr('category'),
                        category.map((value) => value.replace(/\s+/g, ''))
                    ]
                }
            });
        }
        if (gender && gender.length > 0) {
            andConditions.push({
                $expr: {
                    $in: [
                        buildNormalizedFieldExpr('genderCategory'),
                        gender.map((value) => value.replace(/\s+/g, ''))
                    ]
                }
            });
        }
        if (query && query.trim() !== '') {
            const normalizedQuery = normalizeToken(query).replace(/\s+/g, ' ');
            const safeQuery = escapeRegex(normalizedQuery);
            const phraseRegex = new RegExp(safeQuery, 'i');
            const tokens = tokenizeQuery(query);
            const tokenRegexes = tokens.map((token) => new RegExp(escapeRegex(token), 'i'));
            andConditions.push({
                $or: [
                { name: phraseRegex },
                { description: phraseRegex },
                { brand: phraseRegex },
                { category: phraseRegex },
                ...(tokenRegexes.length
                    ? [
                        { name: { $in: tokenRegexes } },
                        { description: { $in: tokenRegexes } },
                        { brand: { $in: tokenRegexes } },
                        { category: { $in: tokenRegexes } }
                    ]
                    : [])
                ]
            });
        }

        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }

        const safeOrder = sortOrder === 'asc' ? 1 : -1;
        // Accept multiple sortBy names from UI: 'price', 'offerPrice', 'minOfferPrice', 'name', 'createdAt'
        const sort = (sortBy === 'price' || sortBy === 'offerPrice' || sortBy === 'minOfferPrice')
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

        const inventoryByVariantId = buildInventoryByVariantId(inventories);

        const products = productsRaw.map((productRaw) => {
            const { variants = [], ...product } = productRaw || {};
            const inventoryForProduct = {};
            variants.forEach((variant) => {
                const key = String(variant._id);
                if (inventoryByVariantId[key]) {
                    inventoryForProduct[key] = inventoryByVariantId[key];
                }
            });

            return {
                product,
                variants,
                inventoryByVariantId: inventoryForProduct
            };
        });

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
                    query: query ? normalizeToken(query) : query,
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
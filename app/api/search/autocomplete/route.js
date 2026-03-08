import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import { buildInventoryByVariantId } from '@/lib/v2ProductView';
import { rateLimit, escapeRegex } from '@/lib/rateLimit';

// Ensure Next.js does not attempt static rendering for this route.
export const dynamic = 'force-dynamic';

// ✅ PRODUCTION FIX 3: Rate limiting to prevent abuse
const limiter = rateLimit({ limit: 60, window: 60 }); // 60 requests per minute

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

        await connectDB();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = Math.min(parseInt(searchParams.get('limit')) || 5, 10); // Cap at 10

        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                success: true,
                suggestions: [],
                products: [],
                categories: [],
            }, {
                headers: {
                    'X-RateLimit-Remaining': remaining.toString()
                }
            });
        }

        // ✅ PRODUCTION FIX 2: Prefix-only regex (more efficient)
        const escapedQuery = escapeRegex(query.trim());
        const prefixRegex = new RegExp(`^${escapedQuery}`, 'i');
        const containsRegex = new RegExp(escapedQuery, 'i');

        // ✅ Search with STRICT limits and minimal fields
        const matchingProducts = await ProductV2
            .find({
                status: 'active',
                $or: [
                    { name: prefixRegex },        // Prefix match (fastest)
                    { brand: prefixRegex },
                    { category: containsRegex },  // Category can be contains
                ],
            })
            .select('name brand category slug') // ✅ Minimal fields only
            .limit(limit)
            .lean();

        const productIds = matchingProducts.map((product) => product._id);
        const variants = productIds.length
            ? await ProductVariant.find({
                productId: { $in: productIds },
                visibility: { $ne: 'hidden' }
            }).lean()
            : [];

        const variantIds = variants.map((variant) => variant._id);
        const inventories = variantIds.length
            ? await Inventory.find({ variantId: { $in: variantIds } }).lean()
            : [];

        const inventoryByVariantId = buildInventoryByVariantId(inventories);

        const variantsByProductId = new Map();
        variants.forEach((variant) => {
            const key = String(variant.productId);
            if (!variantsByProductId.has(key)) {
                variantsByProductId.set(key, []);
            }
            variantsByProductId.get(key).push(variant);
        });

        const productSuggestions = matchingProducts.map((product) => {
            const variantsForProduct = variantsByProductId.get(String(product._id)) || [];
            const inventoryForProduct = {};
            variantsForProduct.forEach((variant) => {
                const key = String(variant._id);
                if (inventoryByVariantId[key]) {
                    inventoryForProduct[key] = inventoryByVariantId[key];
                }
            });

            return {
                product,
                variants: variantsForProduct,
                inventoryByVariantId: inventoryForProduct
            };
        });

        // Extract unique categories (limit to 3)
        const categories = [
            ...new Set(matchingProducts.map((product) => product.category).filter(Boolean)),
        ].slice(0, 3);

        // Extract unique brands (limit to 3)
        const brands = [
            ...new Set(matchingProducts.map((product) => product.brand).filter(Boolean)),
        ].slice(0, 3);

        // Create suggestion items (max 6 total)
        const suggestions = [
            ...categories.map((cat) => ({ type: 'category', value: cat })),
            ...brands.map((brand) => ({ type: 'brand', value: brand })),
        ].slice(0, 6);

        return NextResponse.json({
            success: true,
            query,
            suggestions,
            products: productSuggestions.slice(0, 5), // Max 5 products
            categories,
        }, {
            headers: {
                'X-RateLimit-Remaining': remaining.toString(),
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error('Search autocomplete error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch search suggestions',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
            },
            { status: 500 }
        );
    }
}

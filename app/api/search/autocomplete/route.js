import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';
import { rateLimit, escapeRegex } from '@/lib/rateLimit';

// ✅ PRODUCTION FIX 1: Cache autocomplete results for 60 seconds
// Autocomplete data doesn't need to be real-time
export const revalidate = 60;

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
        const products = await Product
            .find({
                $or: [
                    { name: prefixRegex },        // Prefix match (fastest)
                    { brand: prefixRegex },
                    { category: containsRegex },  // Category can be contains
                    { subCategory: containsRegex },
                ],
            })
            .select('name image offerPrice category brand slug _id') // ✅ Minimal fields only
            .limit(limit)
            .lean();

        // Extract unique categories (limit to 3)
        const categories = [
            ...new Set(products.map((p) => p.category).filter(Boolean)),
        ].slice(0, 3);

        // Extract unique brands (limit to 3)
        const brands = [
            ...new Set(products.map((p) => p.brand).filter(Boolean)),
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
            products: products.slice(0, 5), // Max 5 products
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

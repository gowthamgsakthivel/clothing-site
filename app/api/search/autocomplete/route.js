import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import productModel from '@/models/productModel';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit')) || 10;

        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                success: true,
                suggestions: [],
                products: [],
                categories: [],
            });
        }

        const searchRegex = new RegExp(query, 'i');

        // Search for matching products
        const products = await productModel
            .find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { category: searchRegex },
                    { subCategory: searchRegex },
                    { brand: searchRegex },
                ],
            })
            .select('name image price offerPrice category subCategory brand')
            .limit(limit)
            .lean();

        // Extract unique categories from matching products
        const categories = [
            ...new Set(products.map((p) => p.category).filter(Boolean)),
        ].slice(0, 5);

        // Extract unique subcategories
        const subCategories = [
            ...new Set(products.map((p) => p.subCategory).filter(Boolean)),
        ].slice(0, 5);

        // Extract unique brands
        const brands = [
            ...new Set(products.map((p) => p.brand).filter(Boolean)),
        ].slice(0, 5);

        // Create suggestion items
        const suggestions = [
            ...categories.map((cat) => ({ type: 'category', value: cat })),
            ...subCategories.map((sub) => ({ type: 'subcategory', value: sub })),
            ...brands.map((brand) => ({ type: 'brand', value: brand })),
        ].slice(0, 8);

        return NextResponse.json({
            success: true,
            query,
            suggestions,
            products: products.slice(0, 5),
            categories,
        });
    } catch (error) {
        console.error('Search autocomplete error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch search suggestions',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

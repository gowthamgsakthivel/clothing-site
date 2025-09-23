import connectDB from "@/config/db";
import Product from "@/models/Product";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const category = searchParams.get('category');
        const gender = searchParams.get('gender');
        const minPrice = parseFloat(searchParams.get('minPrice') || '0');
        const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000000');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        await connectDB();

        // Build the filter object
        const filter = {
            offerPrice: { $gte: minPrice, $lte: maxPrice }
        };

        // Add text search if query exists
        if (query && query.trim() !== '') {
            // Create text index if it doesn't exist
            try {
                await Product.collection.createIndex({
                    name: "text",
                    description: "text",
                    brand: "text",
                    category: "text"
                });
            } catch (error) {
                // Index might already exist
                console.log("Index creation:", error.message);
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

        // Count total products matching the filter
        const totalProducts = await Product.countDocuments(filter);

        // Calculate pagination
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalProducts / limit);

        // Create sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // If using text search, sort by relevance score first
        if (query && query.trim() !== '') {
            sort.score = { $meta: "textScore" };
        }

        // Get products
        let products;
        if (query && query.trim() !== '') {
            products = await Product.find(
                filter,
                { score: { $meta: "textScore" } } // Include text score
            )
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean();
        } else {
            products = await Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean();
        }

        // Return response with products
        return NextResponse.json({
            success: true,
            products: products,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalResults: totalProducts
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
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to search products"
        }, { status: 500 });
    }
}
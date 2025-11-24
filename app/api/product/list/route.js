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
        const rawProducts = await Product.find({})
            .sort({ date: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        // Convert products to ensure backward compatibility
        const products = rawProducts.map(product => {
            const productObj = product.toObject();

            // If product has new inventory format but no color array, generate one for backward compatibility
            if (productObj.inventory && productObj.inventory.length > 0 && (!productObj.color || productObj.color.length === 0)) {
                productObj.color = productObj.inventory.map(item => ({
                    color: item.color.name,
                    stock: item.sizeStock.reduce((sum, sizeStock) => sum + (sizeStock.quantity || 0), 0)
                }));

                // Generate sizes array if missing
                if (!productObj.sizes || productObj.sizes.length === 0) {
                    const allSizes = new Set();
                    productObj.inventory.forEach(item => {
                        item.sizeStock.forEach(sizeStock => {
                            if (sizeStock.quantity > 0) {
                                allSizes.add(sizeStock.size);
                            }
                        });
                    });
                    productObj.sizes = Array.from(allSizes);
                }
            }

            return productObj;
        });

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

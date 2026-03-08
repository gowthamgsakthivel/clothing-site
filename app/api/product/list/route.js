import ProductV2 from "@/models/v2/Product";
import ProductVariant from "@/models/v2/ProductVariant";
import Inventory from "@/models/v2/Inventory";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import { buildInventoryByVariantId } from "@/lib/v2ProductView";

export async function GET(request) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        await connectDB();

        const filter = { status: 'active' };

        // Get total count for pagination info
        const totalProducts = await ProductV2.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);

        // Get paginated products
        const rawProducts = await ProductV2.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const productIds = rawProducts.map((product) => product._id);

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

        const variantsByProduct = new Map();
        variants.forEach((variant) => {
            const key = String(variant.productId);
            if (!variantsByProduct.has(key)) {
                variantsByProduct.set(key, []);
            }
            variantsByProduct.get(key).push(variant);
        });

        const inventoryByVariantId = buildInventoryByVariantId(inventories);

        const products = rawProducts.map((product) => {
            const variantsForProduct = variantsByProduct.get(String(product._id)) || [];
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

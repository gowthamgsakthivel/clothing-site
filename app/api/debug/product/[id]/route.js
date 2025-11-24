import Product from "@/models/Product";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const { id } = params;
        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json({
                success: false,
                message: "Product not found"
            }, { status: 404 });
        }

        const productObj = product.toObject();

        // Analyze the product structure
        const analysis = {
            hasNewInventoryFormat: !!(productObj.inventory && productObj.inventory.length > 0),
            hasOldColorFormat: !!(productObj.color && productObj.color.length > 0),
            hasSizes: !!(productObj.sizes && productObj.sizes.length > 0),
            inventoryCount: productObj.inventory ? productObj.inventory.length : 0,
            colorCount: productObj.color ? productObj.color.length : 0,
            sizesCount: productObj.sizes ? productObj.sizes.length : 0
        };

        // Generate compatibility data
        let compatibilityData = null;
        if (productObj.inventory && productObj.inventory.length > 0) {
            compatibilityData = {
                generatedColors: productObj.inventory.map(item => ({
                    color: item.color.name,
                    stock: item.sizeStock.reduce((sum, sizeStock) => sum + (sizeStock.quantity || 0), 0)
                })),
                generatedSizes: [...new Set(productObj.inventory.flatMap(item =>
                    item.sizeStock.filter(ss => ss.quantity > 0).map(ss => ss.size)
                ))]
            };
        }

        return NextResponse.json({
            success: true,
            product: productObj,
            analysis,
            compatibilityData
        });
    } catch (error) {
        console.error("Debug error:", error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
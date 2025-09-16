import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectDB from "@/config/db";

export async function POST(request) {
    try {
        await connectDB();
        const { id, stock } = await request.json();
        if (!id || stock === undefined) {
            return NextResponse.json({ success: false, message: "Invalid data" });
        }
        const product = await Product.findById(id);
        if (!product) {
            return NextResponse.json({ success: false, message: "Product not found" });
        }
        product.stock = stock;
        await product.save();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

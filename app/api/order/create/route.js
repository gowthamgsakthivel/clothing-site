

import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Orders";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";



export async function POST(request) {
    try {
        await connectDB();
        const { userId } = getAuth(request);
        const { address, items, paymentMethod, paymentStatus } = await request.json();
        console.log('Order Create Debug:', { paymentMethod, paymentStatus });

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid data' });
        }

        // calculate amount using items (fix async reduce bug)
        let amount = 0;
        // items: [{ product: cartKey, quantity }], cartKey = productId, productId_color, or productId_color_size
        const orderItems = [];
        for (const item of items) {
            let productId = item.product;
            let color = undefined;
            let size = undefined;
            if (typeof productId === 'string' && productId.includes('_')) {
                const split = productId.split('_');
                productId = split[0];
                if (split.length === 3) {
                    color = split[1];
                    size = split[2];
                } else if (split.length === 2) {
                    // Could be color or size
                    // Try to match color format
                    if (split[1].startsWith('#') || split[1].length === 7) {
                        color = split[1];
                    } else {
                        size = split[1];
                    }
                }
            }
            const product = await Product.findById(productId);
            if (product) {
                amount += product.offerPrice * item.quantity;
                // Reduce stock for color if present
                if (color && Array.isArray(product.color)) {
                    const colorObj = product.color.find(c => c.color === (color.startsWith('#') ? color : `#${color}`));
                    if (colorObj) {
                        colorObj.stock = Math.max(0, (colorObj.stock || 0) - item.quantity);
                    }
                }
                // Reduce total stock
                product.stock = Math.max(0, (product.stock || 0) - item.quantity);
                await product.save();
                orderItems.push({ product: productId, quantity: item.quantity, color, size });
            }
        }


        // Direct DB insert for local/dev debugging
        await connectDB();
        await Order.create({
            userId,
            address,
            items: orderItems,
            amount: amount + Math.floor(amount * 0.02),
            paymentMethod: paymentMethod || 'COD',
            paymentStatus: paymentStatus || 'Pending',
            date: Date.now()
        });

        // clear user cart
        const user = await User.findById(userId)
        user.cartItems = {}
        await user.save()

        return NextResponse.json({ success: true, message: 'Order Placed' });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
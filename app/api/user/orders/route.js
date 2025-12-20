import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Order from "@/models/Orders";

export async function GET(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        // Fetch all orders for the user, sorted by date (newest first)
        const orders = await Order.find({ userId })
            .sort({ date: -1 })
            .lean();

        // Transform orders to match frontend expectations
        const transformedOrders = orders.map(order => ({
            _id: order._id.toString(),
            items: order.items.map(item => ({
                name: item.designName || item.product?.name || 'Product',
                image: item.customDesignImage ? [item.customDesignImage] : (item.product?.image || []),
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                isCustomDesign: item.isCustomDesign || false
            })),
            totalAmount: order.amount,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            createdAt: new Date(order.date).toISOString(),
            address: order.address
        }));

        return NextResponse.json({
            success: true,
            orders: transformedOrders
        });

    } catch (error) {
        console.error("Error fetching user orders:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch orders", error: error.message },
            { status: 500 }
        );
    }
}

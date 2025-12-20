import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import ReturnRequest from "@/models/ReturnRequest";
import Order from "@/models/Orders";

// GET - Fetch return requests
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

        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        let query = { userId };
        if (orderId) query.orderId = orderId;

        const returnRequests = await ReturnRequest.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            returns: returnRequests
        });

    } catch (error) {
        console.error("Error fetching return requests:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch return requests", error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create return request
export async function POST(req) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const body = await req.json();
        const { orderId, items, reason, description, images } = body;

        // Validate required fields
        if (!orderId || !items || items.length === 0 || !reason || !description) {
            return NextResponse.json(
                { success: false, message: "All fields are required" },
                { status: 400 }
            );
        }

        // Verify order exists and belongs to user
        const order = await Order.findOne({ _id: orderId, userId });
        
        if (!order) {
            return NextResponse.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }

        // Check if order is eligible for return (delivered within return window)
        if (order.status !== 'Delivered') {
            return NextResponse.json(
                { success: false, message: "Only delivered orders can be returned" },
                { status: 400 }
            );
        }

        // Check if return already exists for this order
        const existingReturn = await ReturnRequest.findOne({ orderId, userId });
        if (existingReturn) {
            return NextResponse.json(
                { success: false, message: "Return request already exists for this order" },
                { status: 400 }
            );
        }

        // Calculate refund amount
        const refundAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const newReturn = new ReturnRequest({
            orderId,
            userId,
            items,
            reason,
            description,
            images: images || [],
            refundAmount,
            status: 'Pending'
        });

        await newReturn.save();

        // Update order status to indicate return is in progress
        order.status = 'Return Requested';
        await order.save();

        return NextResponse.json({
            success: true,
            message: "Return request submitted successfully",
            returnRequest: newReturn
        });

    } catch (error) {
        console.error("Error creating return request:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create return request", error: error.message },
            { status: 500 }
        );
    }
}

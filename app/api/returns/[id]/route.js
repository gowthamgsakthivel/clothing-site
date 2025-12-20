import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import ReturnRequest from "@/models/ReturnRequest";

// GET - Fetch single return request
export async function GET(req, { params }) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const { id } = await params;

        const returnRequest = await ReturnRequest.findOne({ _id: id, userId });
        
        if (!returnRequest) {
            return NextResponse.json(
                { success: false, message: "Return request not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            returnRequest
        });

    } catch (error) {
        console.error("Error fetching return request:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch return request", error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Cancel return request (only if pending)
export async function DELETE(req, { params }) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const { id } = await params;

        const returnRequest = await ReturnRequest.findOne({ _id: id, userId });
        
        if (!returnRequest) {
            return NextResponse.json(
                { success: false, message: "Return request not found" },
                { status: 404 }
            );
        }

        // Only allow cancellation if pending
        if (returnRequest.status !== 'Pending') {
            return NextResponse.json(
                { success: false, message: "Cannot cancel return request in current status" },
                { status: 400 }
            );
        }

        await ReturnRequest.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: "Return request cancelled successfully"
        });

    } catch (error) {
        console.error("Error cancelling return request:", error);
        return NextResponse.json(
            { success: false, message: "Failed to cancel return request", error: error.message },
            { status: 500 }
        );
    }
}

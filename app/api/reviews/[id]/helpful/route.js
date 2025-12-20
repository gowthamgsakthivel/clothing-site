import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Review from "@/models/Review";

// POST - Mark review as helpful
export async function POST(req, { params }) {
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

        const review = await Review.findById(id);

        if (!review) {
            return NextResponse.json(
                { success: false, message: "Review not found" },
                { status: 404 }
            );
        }

        // Check if user already marked this as helpful
        const alreadyMarked = review.helpfulBy.includes(userId);

        if (alreadyMarked) {
            // Remove helpful mark
            review.helpfulBy = review.helpfulBy.filter(id => id !== userId);
            review.helpful = Math.max(0, review.helpful - 1);
        } else {
            // Add helpful mark
            review.helpfulBy.push(userId);
            review.helpful += 1;
        }

        await review.save();

        return NextResponse.json({
            success: true,
            helpful: review.helpful,
            isMarked: !alreadyMarked
        });

    } catch (error) {
        console.error("Error marking review as helpful:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update review", error: error.message },
            { status: 500 }
        );
    }
}

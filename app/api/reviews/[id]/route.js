import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Review from "@/models/Review";

// PUT - Update review
export async function PUT(req, { params }) {
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
        const body = await req.json();
        const { rating, title, comment, images } = body;

        // Find review and verify ownership
        const review = await Review.findOne({ _id: id, userId });

        if (!review) {
            return NextResponse.json(
                { success: false, message: "Review not found" },
                { status: 404 }
            );
        }

        // Update fields
        if (rating) review.rating = rating;
        if (title) review.title = title;
        if (comment) review.comment = comment;
        if (images !== undefined) review.images = images;
        review.updatedAt = new Date();

        await review.save();

        return NextResponse.json({
            success: true,
            message: "Review updated successfully",
            review
        });

    } catch (error) {
        console.error("Error updating review:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update review", error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete review
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

        // Find and delete review (verify ownership)
        const result = await Review.findOneAndDelete({ _id: id, userId });

        if (!result) {
            return NextResponse.json(
                { success: false, message: "Review not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete review", error: error.message },
            { status: 500 }
        );
    }
}

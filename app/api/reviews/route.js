import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Review from "@/models/Review";
import Order from "@/models/Orders";

// GET - Fetch reviews for a product
export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const userId = searchParams.get('userId');
        const sort = searchParams.get('sort') || 'recent'; // recent, helpful, rating-high, rating-low

        if (!productId && !userId) {
            return NextResponse.json(
                { success: false, message: "Product ID or User ID required" },
                { status: 400 }
            );
        }

        let query = {};
        if (productId) query.productId = productId;
        if (userId) query.userId = userId;

        // Sorting logic
        let sortQuery = { createdAt: -1 }; // Default: newest first
        if (sort === 'helpful') sortQuery = { helpful: -1, createdAt: -1 };
        if (sort === 'rating-high') sortQuery = { rating: -1, createdAt: -1 };
        if (sort === 'rating-low') sortQuery = { rating: 1, createdAt: -1 };

        const reviews = await Review.find(query)
            .sort(sortQuery)
            .lean();

        // Calculate average rating and rating distribution
        let stats = null;
        if (productId) {
            const allReviews = await Review.find({ productId });
            const totalReviews = allReviews.length;
            const avgRating = totalReviews > 0
                ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
                : 0;

            const distribution = {
                5: allReviews.filter(r => r.rating === 5).length,
                4: allReviews.filter(r => r.rating === 4).length,
                3: allReviews.filter(r => r.rating === 3).length,
                2: allReviews.filter(r => r.rating === 2).length,
                1: allReviews.filter(r => r.rating === 1).length
            };

            stats = {
                totalReviews,
                averageRating: parseFloat(avgRating),
                distribution
            };
        }

        return NextResponse.json({
            success: true,
            reviews,
            stats
        });

    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch reviews", error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new review
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
        const { productId, rating, title, comment, images, orderId, size, color } = body;

        // Validate required fields
        if (!productId || !rating || !title || !comment) {
            return NextResponse.json(
                { success: false, message: "All fields are required" },
                { status: 400 }
            );
        }

        // Check if rating is valid
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, message: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return NextResponse.json(
                { success: false, message: "You have already reviewed this product" },
                { status: 400 }
            );
        }

        // Check if this is a verified purchase
        let verifiedPurchase = false;
        if (orderId) {
            const order = await Order.findOne({
                _id: orderId,
                userId,
                status: 'Delivered'
            });
            verifiedPurchase = !!order;
        } else {
            // Check if user has any delivered order with this product
            const orders = await Order.find({
                userId,
                status: 'Delivered',
                'items.product': productId
            });
            verifiedPurchase = orders.length > 0;
        }

        const newReview = new Review({
            productId,
            userId,
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
            userEmail: user.emailAddresses?.[0]?.emailAddress || '',
            rating,
            title,
            comment,
            images: images || [],
            verifiedPurchase,
            orderId: orderId || null,
            size,
            color
        });

        await newReview.save();

        return NextResponse.json({
            success: true,
            message: "Review submitted successfully",
            review: newReview
        });

    } catch (error) {
        console.error("Error creating review:", error);
        return NextResponse.json(
            { success: false, message: "Failed to submit review", error: error.message },
            { status: 500 }
        );
    }
}

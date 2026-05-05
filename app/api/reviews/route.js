import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Review from "@/models/Review";
import { getDeliveredPurchaseOrder, refreshProductRatingStats } from "@/lib/reviewRatings";

// GET - Fetch reviews for a product
export async function GET(req) {
    try {
        await connectDB();
        const { userId: authUserId } = await auth();

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const reviewUserId = searchParams.get('userId');
        const sort = searchParams.get('sort') || 'recent'; // recent, helpful, rating-high, rating-low

        if (!productId && !reviewUserId) {
            return NextResponse.json(
                { success: false, message: "Product ID or User ID required" },
                { status: 400 }
            );
        }

        let query = {};
        if (productId) query.productId = productId;
        if (reviewUserId) query.userId = reviewUserId;

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

        let reviewAccess = null;
        if (productId && authUserId) {
            const existingReview = await Review.findOne({ productId, userId: authUserId }).lean();
            if (existingReview) {
                reviewAccess = {
                    canReview: false,
                    reason: 'already_reviewed',
                    message: 'You have already reviewed this product.'
                };
            } else {
                const purchaseOrder = await getDeliveredPurchaseOrder({ userId: authUserId, productId });
                reviewAccess = purchaseOrder
                    ? {
                        canReview: true,
                        reason: 'eligible',
                        message: null,
                        orderId: purchaseOrder._id
                    }
                    : {
                        canReview: false,
                        reason: 'purchase_required',
                        message: 'Only verified buyers with a delivered order can review this product.'
                    };
            }
        }

        return NextResponse.json({
            success: true,
            reviews,
            stats,
            reviewAccess
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

        const purchaseOrder = await getDeliveredPurchaseOrder({ userId, productId, orderId });
        const hasPurchased = Boolean(purchaseOrder);
        if (!hasPurchased) {
            throw new Error('Only buyers can review');
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return NextResponse.json(
                { success: false, message: "You have already reviewed this product" },
                { status: 400 }
            );
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
            verifiedPurchase: true,
            orderId: orderId || purchaseOrder._id || null,
            size,
            color
        });

        await newReview.save();
        const ratingStats = await refreshProductRatingStats(productId);

        return NextResponse.json({
            success: true,
            message: "Review submitted successfully",
            review: newReview,
            ratingStats
        });

    } catch (error) {
        console.error("Error creating review:", error);
        if (error.message === 'Only buyers can review') {
            return NextResponse.json(
                { success: false, message: 'Only verified buyers with a delivered order can submit reviews for this product.' },
                { status: 403 }
            );
        }
        return NextResponse.json(
            { success: false, message: "Failed to submit review", error: error.message },
            { status: 500 }
        );
    }
}

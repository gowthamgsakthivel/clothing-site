import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        maxLength: 100
    },
    comment: {
        type: String,
        required: true,
        maxLength: 1000
    },
    images: [{
        type: String
    }],
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order'
    },
    helpful: {
        type: Number,
        default: 0
    },
    helpfulBy: [{
        type: String // userId array
    }],
    size: String,
    color: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

const Review = mongoose.models.review || mongoose.model('review', reviewSchema);

export default Review;

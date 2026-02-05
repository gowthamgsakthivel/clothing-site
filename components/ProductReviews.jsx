'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';

const ProductReviews = ({ productId }) => {
    const { user } = useAppContext();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [sortBy, setSortBy] = useState('recent');
    const [userReview, setUserReview] = useState(null);
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const carouselRef = useRef(null);

    useEffect(() => {
        fetchReviews();
    }, [productId, sortBy]);

    useEffect(() => {
        if (reviews.length === 0) {
            setCurrentReviewIndex(0);
            return;
        }

        setCurrentReviewIndex((prev) => Math.min(prev, reviews.length - 1));
    }, [reviews.length]);

    const fetchReviews = async () => {
        try {
            const { data } = await axios.get(`/api/reviews?productId=${productId}&sort=${sortBy}`);
            if (data.success) {
                setReviews(data.reviews);
                setStats(data.stats);

                // Find user's review if exists
                if (user) {
                    const myReview = data.reviews.find(r => r.userId === user.id);
                    setUserReview(myReview);
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmitted = (review) => {
        setShowReviewForm(false);
        setEditingReview(null);
        fetchReviews();
    };

    const handleDeleteReview = (reviewId) => {
        setReviews(reviews.filter(r => r._id !== reviewId));
        setUserReview(null);
        fetchReviews();
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setShowReviewForm(true);
    };

    const handlePrevReview = () => {
        const nextIndex = Math.max(0, currentReviewIndex - 1);
        setCurrentReviewIndex(nextIndex);
        if (carouselRef.current) {
            const width = carouselRef.current.clientWidth;
            carouselRef.current.scrollTo({ left: width * nextIndex, behavior: 'smooth' });
        }
    };

    const handleNextReview = () => {
        const nextIndex = Math.min(reviews.length - 1, currentReviewIndex + 1);
        setCurrentReviewIndex(nextIndex);
        if (carouselRef.current) {
            const width = carouselRef.current.clientWidth;
            carouselRef.current.scrollTo({ left: width * nextIndex, behavior: 'smooth' });
        }
    };

    const handleCarouselScroll = () => {
        if (!carouselRef.current) return;
        const width = carouselRef.current.clientWidth;
        if (width === 0) return;
        const index = Math.round(carouselRef.current.scrollLeft / width);
        if (index !== currentReviewIndex) {
            setCurrentReviewIndex(index);
        }
    };

    const getRatingPercentage = (rating) => {
        if (!stats || stats.totalReviews === 0) return 0;
        return ((stats.distribution[rating] / stats.totalReviews) * 100).toFixed(0);
    };

    if (loading) {
        return (
            <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Rating Summary */}
            <div className="bg-white rounded-lg border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

                {stats && stats.totalReviews > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Overall Rating */}
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                                <div className="text-5xl font-bold text-gray-900">
                                    {stats.averageRating}
                                </div>
                                <div>
                                    <div className="flex mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`text-2xl ${star <= Math.round(stats.averageRating)
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-sm text-gray-700">{rating}</span>
                                        <span className="text-yellow-400">★</span>
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 transition-all"
                                            style={{ width: `${getRatingPercentage(rating)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">
                                        {stats.distribution[rating]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No reviews yet</p>
                        <p className="text-sm text-gray-500">Be the first to review this product!</p>
                    </div>
                )}

                {/* Write Review Button */}
                {user && !userReview && !showReviewForm && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="mt-6 w-full md:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                    >
                        Write a Review
                    </button>
                )}

                {!user && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                            Please sign in to write a review
                        </p>
                    </div>
                )}
            </div>

            {/* Review Form */}
            {showReviewForm && user && (
                <div>
                    <ReviewForm
                        productId={productId}
                        onReviewSubmitted={handleReviewSubmitted}
                        existingReview={editingReview}
                    />
                    <button
                        onClick={() => {
                            setShowReviewForm(false);
                            setEditingReview(null);
                        }}
                        className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 && (
                <div>
                    {/* Sort Options */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                        </h3>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="helpful">Most Helpful</option>
                            <option value="rating-high">Highest Rating</option>
                            <option value="rating-low">Lowest Rating</option>
                        </select>
                    </div>

                    {/* Mobile Swipe Carousel */}
                    <div className="md:hidden space-y-3">
                        <div className="relative">
                            <div
                                ref={carouselRef}
                                onScroll={handleCarouselScroll}
                                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                            >
                                {reviews.map((review) => (
                                    <div key={review._id} className="min-w-full snap-start pr-1">
                                        <ReviewCard
                                            review={review}
                                            onDelete={handleDeleteReview}
                                            onUpdate={handleEditReview}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow-sm">
                                <button
                                    type="button"
                                    onClick={handlePrevReview}
                                    disabled={currentReviewIndex === 0}
                                    className="h-8 w-8 rounded-full border border-gray-200 text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Previous review"
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextReview}
                                    disabled={currentReviewIndex >= reviews.length - 1}
                                    className="h-8 w-8 rounded-full border border-gray-200 text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Next review"
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Grid */}
                    <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {reviews.map((review) => (
                            <ReviewCard
                                key={review._id}
                                review={review}
                                onDelete={handleDeleteReview}
                                onUpdate={handleEditReview}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReviews;

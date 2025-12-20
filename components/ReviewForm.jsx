'use client';

import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';

const ReviewForm = ({ productId, onReviewSubmitted, orderId = null, existingReview = null }) => {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState(existingReview?.title || '');
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [images, setImages] = useState(existingReview?.images || []);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'sparrow_sports');

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    { method: 'POST', body: formData }
                );
                const data = await response.json();
                return data.secure_url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setImages([...images, ...uploadedUrls]);
            toast.success('Images uploaded successfully');
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            const endpoint = existingReview
                ? `/api/reviews/${existingReview._id}`
                : '/api/reviews';

            const method = existingReview ? 'PUT' : 'POST';

            const { data } = await axios({
                method,
                url: endpoint,
                data: {
                    productId,
                    rating,
                    title,
                    comment,
                    images,
                    orderId
                }
            });

            if (data.success) {
                toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
                onReviewSubmitted(data.review);

                // Reset form if new review
                if (!existingReview) {
                    setRating(0);
                    setTitle('');
                    setComment('');
                    setImages([]);
                }
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
                {existingReview ? 'Edit Your Review' : 'Write a Review'}
            </h3>

            {/* Rating */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="text-3xl focus:outline-none transition-transform hover:scale-110"
                        >
                            <span className={
                                star <= (hoverRating || rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                            }>
                                ★
                            </span>
                        </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600 self-center">
                        {rating > 0 && `${rating} out of 5`}
                    </span>
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sum up your experience"
                    maxLength={100}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    maxLength={1000}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{comment.length}/1000</p>
            </div>

            {/* Images */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Photos (Optional)
                </label>
                <div className="space-y-3">
                    {images.length < 5 && (
                        <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                            <div className="text-center">
                                <span className="text-2xl">📷</span>
                                <p className="text-sm text-gray-600">
                                    {uploading ? 'Uploading...' : 'Click to upload images'}
                                </p>
                                <p className="text-xs text-gray-500">Max 5 images</p>
                            </div>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    )}

                    {/* Image Preview */}
                    {images.length > 0 && (
                        <div className="grid grid-cols-5 gap-2">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    {img ? (
                                        <Image
                                            src={img}
                                            alt={`Preview ${idx + 1}`}
                                            width={100}
                                            height={100}
                                            className="w-full h-20 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                            No Image
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </button>
        </form>
    );
};

export default ReviewForm;

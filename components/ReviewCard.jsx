'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';

const ReviewCard = ({ review, onDelete, onUpdate }) => {
    const { user } = useAppContext();
    const [helpful, setHelpful] = useState(review.helpful || 0);
    const [isHelpful, setIsHelpful] = useState(false);
    const [showFullComment, setShowFullComment] = useState(false);
    const isOwner = user?.id === review.userId;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleHelpful = async () => {
        if (!user) {
            toast.error('Please sign in to mark reviews as helpful');
            return;
        }

        try {
            const { data } = await axios.post(`/api/reviews/${review._id}/helpful`);
            if (data.success) {
                setHelpful(data.helpful);
                setIsHelpful(data.isMarked);
            }
        } catch (error) {
            console.error('Error marking review as helpful:', error);
            toast.error('Failed to update');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            const { data } = await axios.delete(`/api/reviews/${review._id}`);
            if (data.success) {
                toast.success('Review deleted');
                onDelete(review._id);
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Failed to delete review');
        }
    };

    const commentPreview = review.comment.length > 300
        ? review.comment.substring(0, 300) + '...'
        : review.comment;

    return (
        <div className="border rounded-lg p-6 bg-white hover:shadow-md transition">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                        {review.userName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{review.userName}</p>
                            {review.verifiedPurchase && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                                    ✓ Verified Purchase
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">
                                {formatDate(review.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Owner Actions */}
                {isOwner && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdate(review)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Title */}
            <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>

            {/* Size/Color Info */}
            {(review.size || review.color) && (
                <p className="text-sm text-gray-600 mb-2">
                    {review.size && `Size: ${review.size}`}
                    {review.size && review.color && ' • '}
                    {review.color && `Color: ${review.color}`}
                </p>
            )}

            {/* Comment */}
            <p className="text-gray-700 mb-4 whitespace-pre-line">
                {showFullComment ? review.comment : commentPreview}
                {review.comment.length > 300 && (
                    <button
                        onClick={() => setShowFullComment(!showFullComment)}
                        className="ml-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                        {showFullComment ? 'Show less' : 'Read more'}
                    </button>
                )}
            </p>

            {/* Images */}
            {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                    {review.images.map((img, idx) => (
                        img ? (
                            <Image
                                key={idx}
                                src={img}
                                alt={`Review image ${idx + 1}`}
                                width={100}
                                height={100}
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                                onClick={() => window.open(img, '_blank')}
                            />
                        ) : (
                            <div key={idx} className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                No Image
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Helpful Button */}
            <div className="flex items-center gap-4 pt-4 border-t">
                <button
                    onClick={handleHelpful}
                    className={`text-sm font-medium flex items-center gap-2 transition ${isHelpful
                            ? 'text-orange-600'
                            : 'text-gray-600 hover:text-orange-600'
                        }`}
                >
                    <span className="text-lg">{isHelpful ? '👍' : '👍🏻'}</span>
                    Helpful {helpful > 0 && `(${helpful})`}
                </button>
            </div>
        </div>
    );
};

export default ReviewCard;

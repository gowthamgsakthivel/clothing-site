'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ReturnPolicy = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            Return Policy
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Returns accepted within <strong>7 days</strong> of delivery</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Product must be unused, unwashed, and in original packaging</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Tags and labels must be intact</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Refund processed within 5-7 business days after approval</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Free pickup for defective/wrong items</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Custom design orders are non-returnable</span>
            </li>
        </ul>
    </div>
);

const ReturnsPage = () => {
    const { user, currency } = useAppContext();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [returnRequests, setReturnRequests] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'returns'

    const [returnForm, setReturnForm] = useState({
        selectedItems: [],
        reason: '',
        description: '',
        images: []
    });
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const returnReasons = [
        'Wrong Item',
        'Defective Product',
        'Size Issue',
        'Color Different',
        'Quality Issue',
        'Changed Mind',
        'Better Price Found',
        'Other'
    ];

    useEffect(() => {
        if (!user) {
            router.push('/sign-in');
            return;
        }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [ordersRes, returnsRes] = await Promise.all([
                axios.get('/api/user/orders'),
                axios.get('/api/returns')
            ]);

            if (ordersRes.data.success) {
                // Filter only delivered orders
                const deliveredOrders = ordersRes.data.orders.filter(
                    order => order.status === 'Delivered'
                );
                setOrders(deliveredOrders);
            }

            if (returnsRes.data.success) {
                setReturnRequests(returnsRes.data.returns);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length + returnForm.images.length > 5) {
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
            setReturnForm(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls]
            }));
            toast.success('Images uploaded');
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setReturnForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const toggleItemSelection = (item) => {
        setReturnForm(prev => {
            const isSelected = prev.selectedItems.some(i =>
                i.name === item.name && i.size === item.size && i.color === item.color
            );

            if (isSelected) {
                return {
                    ...prev,
                    selectedItems: prev.selectedItems.filter(i =>
                        !(i.name === item.name && i.size === item.size && i.color === item.color)
                    )
                };
            } else {
                return {
                    ...prev,
                    selectedItems: [...prev.selectedItems, item]
                };
            }
        });
    };

    const handleSubmitReturn = async () => {
        if (returnForm.selectedItems.length === 0) {
            toast.error('Please select at least one item');
            return;
        }
        if (!returnForm.reason) {
            toast.error('Please select a return reason');
            return;
        }
        if (!returnForm.description.trim()) {
            toast.error('Please provide a description');
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post('/api/returns', {
                orderId: selectedOrder._id,
                items: returnForm.selectedItems,
                reason: returnForm.reason,
                description: returnForm.description,
                images: returnForm.images
            });

            if (data.success) {
                toast.success('Return request submitted successfully');
                setShowReturnForm(false);
                setSelectedOrder(null);
                setReturnForm({
                    selectedItems: [],
                    reason: '',
                    description: '',
                    images: []
                });
                fetchData();
                setActiveTab('returns');
            }
        } catch (error) {
            console.error('Error submitting return:', error);
            toast.error(error.response?.data?.message || 'Failed to submit return request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelReturn = async (returnId) => {
        if (!confirm('Are you sure you want to cancel this return request?')) return;

        try {
            const { data } = await axios.delete(`/api/returns/${returnId}`);
            if (data.success) {
                toast.success('Return request cancelled');
                fetchData();
            }
        } catch (error) {
            console.error('Error cancelling return:', error);
            toast.error('Failed to cancel return request');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Approved': 'bg-blue-100 text-blue-800',
            'Rejected': 'bg-red-100 text-red-800',
            'Picked Up': 'bg-purple-100 text-purple-800',
            'Refund Processed': 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Refunds</h1>
                        <p className="text-gray-600">
                            Request returns and track refund status for your orders
                        </p>
                    </div>

                    {/* Return Policy */}
                    <ReturnPolicy />

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-sm mb-6">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'orders'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Eligible Orders ({orders.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('returns')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'returns'
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    My Returns ({returnRequests.length})
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Content */}
                    {activeTab === 'orders' && (
                        <div>
                            {!showReturnForm ? (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Select Order to Return
                                    </h2>

                                    {orders.length > 0 ? (
                                        <div className="space-y-4">
                                            {orders.map((order) => (
                                                <div
                                                    key={order._id}
                                                    className="border rounded-lg p-6 hover:shadow-md transition"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">
                                                                Order #{order._id.slice(-8)}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                Delivered on{' '}
                                                                {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-gray-900">
                                                            {currency}{order.totalAmount}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex gap-3 text-sm">
                                                                <span className="text-gray-600">•</span>
                                                                <span className="text-gray-700">
                                                                    {item.name}
                                                                    {item.size && ` - Size: ${item.size}`}
                                                                    {item.color && ` - Color: ${item.color}`}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowReturnForm(true);
                                                        }}
                                                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                                                    >
                                                        Request Return
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className="text-8xl mb-4">📦</div>
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                No Eligible Orders
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                Only delivered orders can be returned
                                            </p>
                                            <button
                                                onClick={() => router.push('/my-orders')}
                                                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                                            >
                                                View All Orders
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Return Request - Order #{selectedOrder._id.slice(-8)}
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setShowReturnForm(false);
                                                setSelectedOrder(null);
                                                setReturnForm({
                                                    selectedItems: [],
                                                    reason: '',
                                                    description: '',
                                                    images: []
                                                });
                                            }}
                                            className="text-gray-600 hover:text-gray-800"
                                        >
                                            ✕ Cancel
                                        </button>
                                    </div>

                                    {/* Select Items */}
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-3">
                                            Select Items to Return
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedOrder.items.map((item, idx) => {
                                                const isSelected = returnForm.selectedItems.some(i =>
                                                    i.name === item.name && i.size === item.size && i.color === item.color
                                                );

                                                return (
                                                    <label
                                                        key={idx}
                                                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${isSelected
                                                                ? 'border-orange-500 bg-orange-50'
                                                                : 'border-gray-200 hover:border-orange-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleItemSelection(item)}
                                                            className="w-5 h-5 text-orange-600 rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {item.size && `Size: ${item.size}`}
                                                                {item.size && item.color && ' • '}
                                                                {item.color && `Color: ${item.color}`}
                                                                {' • '}Qty: {item.quantity}
                                                            </p>
                                                        </div>
                                                        <p className="font-semibold text-gray-900">
                                                            {currency}{item.price * item.quantity}
                                                        </p>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Return Reason */}
                                    <div className="mb-6">
                                        <label className="block font-semibold text-gray-900 mb-3">
                                            Return Reason <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={returnForm.reason}
                                            onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="">Select a reason</option>
                                            {returnReasons.map((reason) => (
                                                <option key={reason} value={reason}>
                                                    {reason}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-6">
                                        <label className="block font-semibold text-gray-900 mb-3">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={returnForm.description}
                                            onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })}
                                            placeholder="Please describe the issue in detail..."
                                            maxLength={500}
                                            rows={4}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {returnForm.description.length}/500
                                        </p>
                                    </div>

                                    {/* Images */}
                                    <div className="mb-6">
                                        <label className="block font-semibold text-gray-900 mb-3">
                                            Upload Images (Optional)
                                        </label>
                                        <div className="space-y-3">
                                            {returnForm.images.length < 5 && (
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

                                            {returnForm.images.length > 0 && (
                                                <div className="grid grid-cols-5 gap-2">
                                                    {returnForm.images.map((img, idx) => (
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

                                    {/* Refund Summary */}
                                    {returnForm.selectedItems.length > 0 && (
                                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                            <h3 className="font-semibold text-gray-900 mb-2">Refund Summary</h3>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Items selected:</span>
                                                <span className="text-gray-900">{returnForm.selectedItems.length}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                                                <span className="text-gray-900">Refund Amount:</span>
                                                <span className="text-green-600">
                                                    {currency}
                                                    {returnForm.selectedItems.reduce(
                                                        (sum, item) => sum + (item.price * item.quantity),
                                                        0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitReturn}
                                        disabled={submitting || uploading}
                                        className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Return Request'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'returns' && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Return Requests ({returnRequests.length})
                            </h2>

                            {returnRequests.length > 0 ? (
                                <div className="space-y-4">
                                    {returnRequests.map((returnReq) => (
                                        <div
                                            key={returnReq._id}
                                            className="border rounded-lg p-6"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        Return Request #{returnReq._id.slice(-8)}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Order #{returnReq.orderId.toString().slice(-8)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Requested on{' '}
                                                        {new Date(returnReq.createdAt).toLocaleDateString('en-IN')}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                                                        returnReq.status
                                                    )}`}
                                                >
                                                    {returnReq.status}
                                                </span>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">
                                                    Reason: <span className="text-gray-900">{returnReq.reason}</span>
                                                </p>
                                                <p className="text-sm text-gray-600">{returnReq.description}</p>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t">
                                                <div>
                                                    <p className="text-sm text-gray-600">Refund Amount</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {currency}{returnReq.refundAmount}
                                                    </p>
                                                </div>
                                                {returnReq.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleCancelReturn(returnReq._id)}
                                                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                                                    >
                                                        Cancel Request
                                                    </button>
                                                )}
                                            </div>

                                            {returnReq.adminResponse && (
                                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                                    <p className="text-sm font-medium text-blue-900 mb-1">
                                                        Admin Response:
                                                    </p>
                                                    <p className="text-sm text-blue-800">
                                                        {returnReq.adminResponse}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="text-8xl mb-4">📋</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        No Return Requests
                                    </h3>
                                    <p className="text-gray-600">
                                        You haven't submitted any return requests yet
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ReturnsPage;

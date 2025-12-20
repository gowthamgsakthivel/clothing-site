'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import OrderTimeline from '@/components/OrderTimeline';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const OrderTrackingPage = () => {
    const { user, currency } = useAppContext();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trackingNumber, setTrackingNumber] = useState('');

    useEffect(() => {
        if (!user) {
            router.push('/sign-in');
            return;
        }
        fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get('/api/user/orders');
            if (data.success) {
                setOrders(data.orders);

                // Auto-select order from URL params
                const params = new URLSearchParams(window.location.search);
                const orderId = params.get('orderId');
                if (orderId) {
                    const order = data.orders.find(o => o._id === orderId);
                    if (order) setSelectedOrder(order);
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const getEstimatedDelivery = (order) => {
        if (order.status === 'Delivered') {
            return 'Delivered';
        }

        const createdDate = new Date(order.createdAt);
        const estimatedDays = 5; // Default 5 days
        const estimatedDate = new Date(createdDate);
        estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

        return estimatedDate.toLocaleDateString('en-IN', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'Order Placed': 'bg-yellow-100 text-yellow-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Processing': 'bg-blue-100 text-blue-800',
            'Shipped': 'bg-purple-100 text-purple-800',
            'Out for Delivery': 'bg-indigo-100 text-indigo-800',
            'Delivered': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800',
            'Returned': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleTrackOrder = () => {
        if (!trackingNumber.trim()) {
            toast.error('Please enter an order ID');
            return;
        }

        const order = orders.find(o =>
            o._id.toLowerCase().includes(trackingNumber.toLowerCase()) ||
            o._id.slice(-8).toLowerCase() === trackingNumber.toLowerCase()
        );

        if (order) {
            setSelectedOrder(order);
            setTrackingNumber('');
        } else {
            toast.error('Order not found');
        }
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
                        <p className="text-gray-600">
                            View real-time status and tracking information for your orders
                        </p>
                    </div>

                    {/* Quick Track Input */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Quick Track
                        </h2>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Enter Order ID (e.g., last 8 digits)"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
                                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                onClick={handleTrackOrder}
                                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                            >
                                Track
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Orders List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Your Orders ({orders.length})
                                </h2>

                                {orders.length > 0 ? (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                        {orders.map((order) => (
                                            <button
                                                key={order._id}
                                                onClick={() => setSelectedOrder(order)}
                                                className={`w-full text-left p-4 rounded-lg border-2 transition ${selectedOrder?._id === order._id
                                                        ? 'border-orange-500 bg-orange-50'
                                                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-medium text-gray-900">
                                                        #{order._id.slice(-8)}
                                                    </p>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                            order.status
                                                        )}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} •{' '}
                                                    {currency}
                                                    {order.totalAmount}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-6xl mb-4">📦</div>
                                        <p className="text-gray-600 mb-4">No orders yet</p>
                                        <button
                                            onClick={() => router.push('/all-products')}
                                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                                        >
                                            Start Shopping
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Details & Tracking */}
                        <div className="lg:col-span-2">
                            {selectedOrder ? (
                                <div className="space-y-6">
                                    {/* Order Header */}
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Order #{selectedOrder._id.slice(-8)}
                                                </h2>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Placed on{' '}
                                                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                                                    selectedOrder.status
                                                )}`}
                                            >
                                                {selectedOrder.status}
                                            </span>
                                        </div>

                                        {/* Estimated Delivery */}
                                        {!['Cancelled', 'Returned', 'Delivered'].includes(selectedOrder.status) && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">🚚</span>
                                                    <div>
                                                        <p className="font-medium text-blue-900">
                                                            Estimated Delivery
                                                        </p>
                                                        <p className="text-sm text-blue-700">
                                                            {getEstimatedDelivery(selectedOrder)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedOrder.status === 'Delivered' && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">✅</span>
                                                    <div>
                                                        <p className="font-medium text-green-900">
                                                            Order Delivered Successfully
                                                        </p>
                                                        <p className="text-sm text-green-700">
                                                            Thank you for your order!
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Timeline */}
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                            Order Timeline
                                        </h3>
                                        <OrderTimeline
                                            status={selectedOrder.status}
                                            createdAt={selectedOrder.createdAt}
                                            updatedAt={selectedOrder.updatedAt || selectedOrder.createdAt}
                                        />
                                    </div>

                                    {/* Order Items */}
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Order Items ({selectedOrder.items.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="w-20 h-20 bg-white rounded flex items-center justify-center">
                                                        {item.image && item.image[0] ? (
                                                            <Image
                                                                src={item.image[0]}
                                                                alt={item.name}
                                                                width={80}
                                                                height={80}
                                                                className="object-cover rounded"
                                                            />
                                                        ) : (
                                                            <span className="text-3xl">📦</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {item.size && `Size: ${item.size}`}
                                                            {item.size && item.color && ' • '}
                                                            {item.color && `Color: ${item.color}`}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-gray-900">
                                                            {currency}
                                                            {item.price * item.quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="bg-white rounded-lg shadow-sm p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            Order Summary
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Payment Method</span>
                                                <span className="font-medium text-gray-900">
                                                    {selectedOrder.paymentMethod}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Payment Status</span>
                                                <span
                                                    className={`font-medium ${selectedOrder.paymentStatus === 'Paid'
                                                            ? 'text-green-600'
                                                            : 'text-yellow-600'
                                                        }`}
                                                >
                                                    {selectedOrder.paymentStatus}
                                                </span>
                                            </div>
                                            <div className="border-t pt-3 flex justify-between">
                                                <span className="font-semibold text-gray-900">
                                                    Total Amount
                                                </span>
                                                <span className="text-xl font-bold text-gray-900">
                                                    {currency}
                                                    {selectedOrder.totalAmount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => router.push('/contact')}
                                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                                        >
                                            Contact Support
                                        </button>
                                        {selectedOrder.status === 'Delivered' && (
                                            <button
                                                onClick={() => {
                                                    const firstItem = selectedOrder.items[0];
                                                    if (firstItem) {
                                                        router.push(`/product/${firstItem.product?._id || 'unknown'}#reviews`);
                                                    }
                                                }}
                                                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                                            >
                                                Leave Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                    <div className="text-8xl mb-4">📦</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Select an Order to Track
                                    </h3>
                                    <p className="text-gray-600">
                                        Choose an order from the list or use the quick track feature
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default OrderTrackingPage;

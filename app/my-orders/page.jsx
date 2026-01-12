'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import SEOMetadata from "@/components/SEOMetadata";
import axios from "axios";
import toast from "react-hot-toast";
import { formatDistance } from 'date-fns';
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MyOrders = () => {

    const router = useRouter();
    const { currency, getToken, user } = useAppContext();

    const [allOrders, setAllOrders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null); // Reset error state

            console.log("🔍 Checking authentication status...");
            console.log("👤 User object:", user);

            if (!user) {
                console.error("❌ User not authenticated");
                setLoading(false);
                setError("Please log in to view your orders");
                return;
            }

            console.log("🔑 Getting auth token...");
            const token = await getToken();
            console.log("📝 Token received:", token ? `${token.substring(0, 20)}...` : "null");

            if (!token) {
                console.error("❌ No authentication token available");
                setError("Authentication failed. Please log in again.");
                setLoading(false);
                return;
            }

            console.log("📤 Sending request to /api/order/list...");
            const { data } = await axios.get('/api/order/list', {
                withCredentials: true,  // IMPORTANT: Send cookies with request
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            console.log("Orders API response:", data);

            if (data.success) {
                // Defensive check for orders data
                if (Array.isArray(data.orders)) {
                    // Always sort by date (most recent first)
                    const ordersArray = [...data.orders];
                    ordersArray.sort((a, b) => {
                        // Convert date values to JavaScript Date objects for comparison
                        let dateA, dateB;

                        // Try to extract date from a
                        if (a.date) {
                            if (typeof a.date === 'number' || /^\d+$/.test(a.date)) {
                                // Unix timestamp (seconds since epoch)
                                dateA = new Date(parseInt(a.date) * 1000);
                            } else {
                                dateA = new Date(a.date);
                            }
                        } else if (a.createdAt) {
                            dateA = new Date(a.createdAt);
                        }

                        // Try to extract date from b
                        if (b.date) {
                            if (typeof b.date === 'number' || /^\d+$/.test(b.date)) {
                                // Unix timestamp (seconds since epoch)
                                dateB = new Date(parseInt(b.date) * 1000);
                            } else {
                                dateB = new Date(b.date);
                            }
                        } else if (b.createdAt) {
                            dateB = new Date(b.createdAt);
                        }

                        // Compare dates if both are valid
                        if (dateA && dateB && !isNaN(dateA) && !isNaN(dateB)) {
                            return dateB - dateA;
                        }
                        // If only one date is valid, prioritize the order with a valid date
                        else if (dateA && !isNaN(dateA)) {
                            return -1;
                        }
                        else if (dateB && !isNaN(dateB)) {
                            return 1;
                        }
                        // Finally use _id as fallback (MongoDB ObjectIds contain a timestamp)
                        else {
                            return (b._id || "").localeCompare(a._id || "");
                        }
                    });

                    console.log("Orders sorted by date:", ordersArray.map(o => {
                        let formattedDate = 'unknown';

                        // Debug raw date values
                        if (o.date) {
                            console.log(`Order ${o._id} has date type: ${typeof o.date}, value: ${o.date}`);
                            try {
                                if (typeof o.date === 'number' || /^\d+$/.test(o.date)) {
                                    formattedDate = new Date(parseInt(o.date) * 1000).toISOString();
                                } else {
                                    formattedDate = new Date(o.date).toISOString();
                                }
                            } catch (err) {
                                console.error("Error formatting date for log:", err, o.date);
                            }
                        } else if (o.createdAt) {
                            try {
                                formattedDate = new Date(o.createdAt).toISOString();
                            } catch (err) {
                                console.error("Error formatting createdAt for log:", err, o.createdAt);
                            }
                        }

                        return {
                            id: o._id,
                            rawDate: o.date,
                            rawCreatedAt: o.createdAt,
                            formattedDate
                        };
                    }));

                    // Debug: Check for custom design pricing
                    ordersArray.forEach(order => {
                        if (order.items && order.items.some(item => item.isCustomDesign)) {
                            console.log(`Order ${order._id} custom design items:`,
                                order.items.filter(item => item.isCustomDesign).map(item => ({
                                    designName: item.designName,
                                    customDesignId: item.customDesignId,
                                    price: item.price,
                                    hasPrice: !!item.price,
                                    priceType: typeof item.price,
                                    quantity: item.quantity
                                }))
                            );
                        }
                    });

                    setAllOrders(ordersArray);
                    setOrders(ordersArray);
                    setActiveFilter('all');
                    setLastUpdated(new Date());
                    setError(null);
                } else {
                    console.warn("Orders data is not an array:", data.orders);
                    setOrders([]);
                }
            } else {
                console.error("API returned error:", data.message);
                toast.error(data.message || "Failed to load orders");
                setError(data.message || "Failed to load orders");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            console.error("Error response:", error.response?.data);

            // Handle 401 Unauthorized
            if (error.response?.status === 401) {
                console.log("🔐 Unauthorized - Token may be invalid or expired");
                setError("Your session has expired. Please refresh the page or log in again.");
                toast.error("Session expired. Please refresh and log in again.");
                // Optionally redirect to home
                setTimeout(() => router.push("/"), 2000);
                return;
            }

            // Handle other HTTP errors
            const errorMessage = error.response?.data?.message || error.message || "Unknown error";
            toast.error(`Error: ${errorMessage}`);
            setError(`Failed to load orders: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Redirect to home if not authenticated
        if (user === false) {
            toast.error("Please log in to view your orders");
            router.push("/");
            return;
        }

        // Fetch orders if user is logged in
        if (user) {
            fetchOrders();
        }
    }, [user]);

    // Auto-refresh orders every 30 seconds if any are pending/in-transit
    useEffect(() => {
        if (!autoRefreshEnabled || allOrders.length === 0) return;

        // Check if any order is in pending/in-transit status
        const hasActiveOrders = allOrders.some(order => {
            const status = order.status?.toLowerCase() || '';
            return ['order placed', 'processing', 'packed', 'shipped', 'in transit', 'out for delivery'].includes(status);
        });

        if (!hasActiveOrders) return;

        const refreshInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing orders...');
            fetchOrders();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(refreshInterval);
    }, [allOrders, autoRefreshEnabled]);

    // Catch any errors during rendering
    const renderOrderSafely = (order, index) => {
        try {
            return (
                <div key={index} className="rounded-xl shadow bg-white p-6 flex flex-col md:flex-row md:items-center gap-6 border border-gray-200">
                    {/* Order content will be rendered here */}
                    {/* This will be replaced by the existing order content JSX */}
                    {/* Just a placeholder to make the function signature correct */}
                    <div></div>
                </div>
            );
        } catch (err) {
            console.error(`Error rendering order ${order?._id || index}:`, err);
            return (
                <div key={index} className="rounded-xl shadow bg-white p-6 border border-red-200">
                    <p className="text-red-500">There was an error displaying this order. Please contact support.</p>
                    <p className="text-xs text-gray-500 mt-2">Order ID: {order?._id || 'Unknown'}</p>
                </div>
            );
        }
    };

    // Helper function to format order date
    const formatOrderDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        try {
            // Debug the timestamp value
            console.log("Formatting date from timestamp:", timestamp, "type:", typeof timestamp);

            // Check if timestamp is a number (Unix timestamp in seconds)
            let date;
            if (typeof timestamp === 'number' || /^\d+$/.test(timestamp)) {
                // Convert seconds to milliseconds (Unix timestamp)
                const timestampMs = parseInt(timestamp) * 1000;
                console.log("Converted timestamp to milliseconds:", timestampMs);
                date = new Date(timestampMs);
            } else {
                // Treat as ISO string or other date format
                console.log("Treating as date string");
                date = new Date(timestamp);
            }

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error("Invalid date from timestamp:", timestamp);
                return { formatted: 'N/A', relative: '' };
            }

            return {
                formatted: date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                relative: formatDistance(date, new Date(), { addSuffix: true })
            };
        } catch (err) {
            console.error("Error formatting date:", err, timestamp);
            return { formatted: 'N/A', relative: '' };
        }
    };    // Helper function to get status color classes
    const getStatusClasses = (status) => {
        // Normalize status to lowercase for comparison
        const normalizedStatus = (status || '').toLowerCase();

        // Return appropriate color classes based on status
        if (['paid', 'confirmed', 'delivered', 'completed'].includes(normalizedStatus)) {
            return 'bg-green-100 text-green-700 border-green-300';
        } else if (['pending', 'processing', 'shipped'].includes(normalizedStatus)) {
            return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        } else if (['rejected', 'cancelled', 'failed'].includes(normalizedStatus)) {
            return 'bg-red-100 text-red-700 border-red-300';
        } else {
            return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <>
            <Navbar />
            <SEOMetadata
                title="My Orders | Sparrow Sports"
                description="View and track your order history at Sparrow Sports. Check order status, payment details, and delivery information."
                keywords="my orders, order history, purchase history, track orders, sports equipment orders"
                url="/my-orders"
            />
            <div className="flex flex-col justify-between px-4 sm:px-6 md:px-8 lg:px-32 py-6 pt-20 md:pt-24 min-h-screen bg-gray-50">
                <div className="space-y-5 max-w-5xl mx-auto w-full">
                    {/* Modern Header Section */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">My Orders</h1>
                            <p className="text-gray-500 text-sm mt-2">Track and manage your orders</p>
                            {lastUpdated && (
                                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                                    Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200 font-medium text-sm shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>

                    {/* Modern Filter Tabs */}
                    {!loading && allOrders.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b-2 border-gray-100">
                            {[
                                { id: 'all', label: 'All Orders', icon: '📦', count: allOrders.length },
                                {
                                    id: 'recent', label: 'Recent (30 days)', icon: '📅', count: allOrders.filter(o => {
                                        let orderDate;
                                        if (o.date) {
                                            if (typeof o.date === 'number' || /^\d+$/.test(o.date)) {
                                                orderDate = new Date(parseInt(o.date) * 1000);
                                            } else {
                                                orderDate = new Date(o.date);
                                            }
                                        } else if (o.createdAt) {
                                            orderDate = new Date(o.createdAt);
                                        } else {
                                            return false;
                                        }
                                        if (isNaN(orderDate.getTime())) return false;
                                        const thirtyDaysAgo = new Date();
                                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                        return orderDate > thirtyDaysAgo;
                                    }).length
                                },
                                { id: 'custom', label: 'Custom Designs', icon: '🎨', count: allOrders.filter(o => o.items && o.items.some(item => item.isCustomDesign)).length },
                                { id: 'paid', label: 'Paid Orders', icon: '✓', count: allOrders.filter(o => ['paid', 'confirmed', 'delivered', 'completed'].includes((o.paymentStatus || '').toLowerCase())).length },
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => {
                                        if (filter.id === 'all') {
                                            setOrders(allOrders);
                                        } else if (filter.id === 'recent') {
                                            const recentOrders = allOrders.filter(o => {
                                                let orderDate;
                                                if (o.date) {
                                                    if (typeof o.date === 'number' || /^\d+$/.test(o.date)) {
                                                        orderDate = new Date(parseInt(o.date) * 1000);
                                                    } else {
                                                        orderDate = new Date(o.date);
                                                    }
                                                } else if (o.createdAt) {
                                                    orderDate = new Date(o.createdAt);
                                                } else {
                                                    return false;
                                                }
                                                if (isNaN(orderDate.getTime())) return false;
                                                const thirtyDaysAgo = new Date();
                                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                                return orderDate > thirtyDaysAgo;
                                            });
                                            setOrders(recentOrders);
                                        } else if (filter.id === 'custom') {
                                            const customDesignOrders = allOrders.filter(o => {
                                                return o.items && o.items.some(item => item.isCustomDesign);
                                            });
                                            setOrders(customDesignOrders);
                                        } else if (filter.id === 'paid') {
                                            const paidOrders = allOrders.filter(o => {
                                                return ['paid', 'confirmed', 'delivered', 'completed'].includes((o.paymentStatus || '').toLowerCase());
                                            });
                                            setOrders(paidOrders);
                                        }
                                        setActiveFilter(filter.id);
                                    }}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200 flex items-center gap-2 ${activeFilter === filter.id
                                            ? 'bg-orange-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <span className="text-base">{filter.icon}</span>
                                    {filter.label}
                                    <span className={`text-xs font-semibold ${activeFilter === filter.id ? 'bg-white text-orange-600' : 'bg-gray-300 text-gray-700'} rounded-full px-2`}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {error ? (
                        <motion.div
                            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <p className="font-medium flex items-center gap-2"><span className="text-lg">⚠️</span>Error loading orders</p>
                            <p className="text-sm mt-1">{error}</p>
                            <button
                                onClick={() => fetchOrders()}
                                className="mt-3 text-sm bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded font-medium transition"
                            >
                                Retry
                            </button>
                        </motion.div>
                    ) : loading ? (
                        <Loading />
                    ) : (
                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <motion.div
                                    className="text-center py-12 bg-white rounded-xl shadow border border-gray-200"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16 text-gray-300 mx-auto">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    {allOrders.length === 0 ? (
                                        <>
                                            <p className="text-gray-600 font-medium">No orders found</p>
                                            <p className="text-gray-400 text-sm mt-1">Your order history will appear here</p>
                                            <button
                                                onClick={() => window.location.href = '/all-products'}
                                                className="mt-4 px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition"
                                            >
                                                Browse Products
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-600 font-medium">No matching orders found</p>
                                            <p className="text-gray-400 text-sm mt-1">Try another filter or view all orders</p>
                                            <button
                                                onClick={() => {
                                                    setOrders(allOrders);
                                                    setActiveFilter('all');
                                                }}
                                                className="mt-4 px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition"
                                            >
                                                View All Orders
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order, index) => {
                                        try {
                                            // Determine status color and icon
                                            const statusLower = (order.status || '').toLowerCase();
                                            let statusColor = 'gray';
                                            let statusIcon = '📦';
                                            let statusBg = 'bg-gray-100 text-gray-800 border-gray-300';

                                            if (statusLower.includes('delivered') || statusLower.includes('completed')) {
                                                statusColor = 'green';
                                                statusIcon = '✅';
                                                statusBg = 'bg-green-100 text-green-800 border-green-300';
                                            } else if (statusLower.includes('shipped') || statusLower.includes('transit')) {
                                                statusColor = 'blue';
                                                statusIcon = '🚚';
                                                statusBg = 'bg-blue-100 text-blue-800 border-blue-300';
                                            } else if (statusLower.includes('packed') || statusLower.includes('processing')) {
                                                statusColor = 'orange';
                                                statusIcon = '📋';
                                                statusBg = 'bg-orange-100 text-orange-800 border-orange-300';
                                            } else if (statusLower.includes('pending')) {
                                                statusColor = 'yellow';
                                                statusIcon = '⏳';
                                                statusBg = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                            }

                                            // Payment status
                                            const paymentLower = (order.paymentStatus || '').toLowerCase();
                                            const isPaid = ['paid', 'confirmed', 'delivered', 'completed'].includes(paymentLower);

                                            const dateInfo = formatOrderDate(order.date);

                                            return (
                                                <motion.div
                                                    key={order._id}
                                                    className={`bg-white rounded-xl border-2 transition-all hover:shadow-lg overflow-hidden ${statusColor === 'green' ? 'border-green-200' : statusColor === 'blue' ? 'border-blue-200' : statusColor === 'orange' ? 'border-orange-200' : 'border-gray-200'}`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.08 }}
                                                >
                                                    {/* Status Bar */}
                                                    <div className={`h-1 ${statusColor === 'green' ? 'bg-green-500' : statusColor === 'blue' ? 'bg-blue-500' : statusColor === 'orange' ? 'bg-orange-500' : 'bg-gray-400'}`}></div>

                                                    {/* Card Content */}
                                                    <div className="p-5 sm:p-6">
                                                        {/* Top Section: Order Info & Status */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-5 border-b border-gray-100">
                                                            <div>
                                                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Order #</p>
                                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{order._id?.substring(order._id.length - 6).toUpperCase() || `Order ${index + 1}`}</h3>
                                                                <p className="text-sm text-gray-600 mt-2">{dateInfo.formatted} <span className="text-gray-400 text-xs">({dateInfo.relative})</span></p>
                                                            </div>
                                                            <div className="flex flex-col gap-2 items-start sm:items-end">
                                                                <div className={`px-3 py-1.5 rounded-full border font-semibold text-sm flex items-center gap-2 ${statusBg}`}>
                                                                    <span>{statusIcon}</span>
                                                                    {order.status || 'Processing'}
                                                                </div>
                                                                {isPaid && (
                                                                    <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">✓ Paid ({order.paymentMethod || 'COD'})</span>
                                                                )}
                                                                {!isPaid && (
                                                                    <span className="text-xs font-medium text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">Pending {order.paymentMethod || 'COD'}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Products Section */}
                                                        <div className="mb-5">
                                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Items ({Array.isArray(order.items) ? order.items.length : 0})</p>
                                                            <div className="space-y-2">
                                                                {Array.isArray(order.items) && order.items.slice(0, 2).map((item, idx) => (
                                                                    <div key={idx} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                                                                        {/* Product Image */}
                                                                        <div className="flex-shrink-0">
                                                                            {(() => {
                                                                                try {
                                                                                    if (item.isCustomDesign && item.customDesignImage) {
                                                                                        return (
                                                                                            <Image
                                                                                                src={item.customDesignImage}
                                                                                                alt="Custom Design"
                                                                                                width={56}
                                                                                                height={56}
                                                                                                className="rounded-md object-cover w-14 h-14 shadow-sm"
                                                                                            />
                                                                                        );
                                                                                    } else if (item.product?.image?.[0]) {
                                                                                        return (
                                                                                            <Image
                                                                                                src={item.product.image[0]}
                                                                                                alt={item.product.name || "Product"}
                                                                                                width={56}
                                                                                                height={56}
                                                                                                className="rounded-md object-cover w-14 h-14 shadow-sm"
                                                                                            />
                                                                                        );
                                                                                    } else {
                                                                                        return (
                                                                                            <div className="w-14 h-14 bg-gray-300 rounded-md flex items-center justify-center text-xs text-gray-600">No image</div>
                                                                                        );
                                                                                    }
                                                                                } catch (err) {
                                                                                    return <div className="w-14 h-14 bg-gray-300 rounded-md"></div>;
                                                                                }
                                                                            })()}
                                                                        </div>

                                                                        {/* Product Details */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                                                                {item.isCustomDesign ? (item.designName || 'Custom Design') : (item.product?.name || 'Product')}
                                                                                {item.isCustomDesign && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">CUSTOM</span>}
                                                                            </p>
                                                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                                                {item.size && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200">Size: {item.size}</span>}
                                                                                {item.quantity && <span className="text-xs text-gray-600">Qty: {item.quantity}</span>}
                                                                            </div>
                                                                        </div>

                                                                        {/* Price */}
                                                                        <div className="text-right flex-shrink-0">
                                                                            <p className="font-bold text-gray-900">
                                                                                {currency}{(() => {
                                                                                    let unitPrice = 0;
                                                                                    if (item.price) {
                                                                                        unitPrice = item.price;
                                                                                    } else if (item.product && typeof item.product === 'object') {
                                                                                        unitPrice = item.product.offerPrice || item.product.price || 0;
                                                                                    }
                                                                                    return (unitPrice * (item.quantity || 1)).toFixed(2);
                                                                                })()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {Array.isArray(order.items) && order.items.length > 2 && (
                                                                    <button
                                                                        onClick={() => window.location.href = `/track-order?orderId=${order._id}`}
                                                                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                                                                    >
                                                                        + {order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Footer: Total & Actions */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 border-t border-gray-100">
                                                            <div>
                                                                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Order Total</p>
                                                                <p className="text-2xl font-bold text-orange-600">{currency}{(order.amount || 0).toFixed(2)}</p>
                                                            </div>
                                                            <div className="flex gap-3 flex-wrap">
                                                                <Link
                                                                    href={`/track-order?orderId=${order._id}`}
                                                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium text-sm flex items-center gap-2"
                                                                >
                                                                    <span>📍</span>Track Order
                                                                </Link>
                                                                <button
                                                                    onClick={() => window.location.href = `/order-details?id=${order._id}`}
                                                                    className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        } catch (err) {
                                            console.error(`Failed to render order ${order?._id || index}:`, err);
                                            return (
                                                <motion.div
                                                    key={`error-${index}`}
                                                    className="bg-red-50 rounded-xl border-2 border-red-200 p-6"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    <p className="text-red-700 font-semibold flex items-center gap-2"><span>⚠️</span>Error displaying order</p>
                                                    <p className="text-xs text-gray-600 mt-2">Order ID: {order?._id || 'Unknown'}</p>
                                                </motion.div>
                                            );
                                        }
                                    })}
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

export default MyOrders;
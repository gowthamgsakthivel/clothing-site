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

const MyOrders = () => {

    const { currency, getToken, user } = useAppContext();

    const [allOrders, setAllOrders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null); // Reset error state

            console.log("Fetching orders...");
            const token = await getToken();

            const { data } = await axios.get('/api/order/list', {
                headers: { Authorization: `Bearer ${token}` },
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
            const errorMessage = error.response?.data?.message || error.message || "Unknown error";
            toast.error(`Error: ${errorMessage}`);
            setError(`Failed to load orders: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const [error, setError] = useState(null);

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
            <div className="flex flex-col justify-between px-3 md:px-8 lg:px-32 py-6 min-h-screen bg-gray-50">
                <div className="space-y-5 max-w-5xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-800">My Orders</h2>
                        <button
                            onClick={fetchOrders}
                            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Orders
                        </button>
                    </div>

                    {!loading && allOrders.length > 0 && (
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    onClick={() => {
                                        setOrders(allOrders);
                                        setActiveFilter('all');
                                    }}
                                >
                                    All Orders
                                </button>
                                <button
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeFilter === 'recent' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    onClick={() => {
                                        const recentOrders = allOrders.filter(o => {
                                            let orderDate;
                                            if (o.date) {
                                                // Check if it's a number or numeric string (Unix timestamp)
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

                                            // Check if date is valid
                                            if (isNaN(orderDate.getTime())) return false;

                                            const thirtyDaysAgo = new Date();
                                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                            return orderDate > thirtyDaysAgo;
                                        });
                                        setOrders(recentOrders);
                                        setActiveFilter('recent');
                                    }}
                                >
                                    Last 30 Days
                                </button>
                                <button
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeFilter === 'custom' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    onClick={() => {
                                        const customDesignOrders = allOrders.filter(o => {
                                            return o.items && o.items.some(item => item.isCustomDesign);
                                        });
                                        setOrders(customDesignOrders);
                                        setActiveFilter('custom');
                                    }}
                                >
                                    Custom Designs
                                </button>
                                <button
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeFilter === 'paid' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    onClick={() => {
                                        const paidOrders = allOrders.filter(o => {
                                            return ['paid', 'confirmed', 'delivered', 'completed'].includes((o.paymentStatus || '').toLowerCase());
                                        });
                                        setOrders(paidOrders);
                                        setActiveFilter('paid');
                                    }}
                                >
                                    Paid Orders
                                </button>
                                <div className="ml-auto text-xs text-gray-500 flex items-center">
                                    {orders.length} of {allOrders.length} orders
                                </div>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
                            <p className="font-medium">Error loading orders</p>
                            <p className="text-sm mt-1">{error}</p>
                            <button
                                onClick={() => { setError(null); fetchOrders(); }}
                                className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                            >
                                Retry
                            </button>
                        </div>
                    ) : loading ? <Loading /> : (
                        <div className="grid gap-6">
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
                            ) : orders.map((order, index) => {
                                // Wrap entire order rendering in try-catch for safety
                                try {
                                    // Early validation of required order properties
                                    if (!order) {
                                        console.error("Invalid order object at index", index);
                                        return (
                                            <div key={`error-${index}`} className="rounded-xl shadow bg-white p-6 border border-red-200">
                                                <p className="text-red-500">There was an error displaying this order.</p>
                                                <p className="text-xs text-gray-500 mt-2">Invalid order data</p>
                                            </div>
                                        );
                                    }

                                    // Get formatted date object
                                    const dateInfo = formatOrderDate(order.date);

                                    // Get status classes for payment status
                                    const paymentStatusClasses = getStatusClasses(order.paymentStatus);
                                    const orderStatusClasses = getStatusClasses(order.status);

                                    return (
                                        <motion.div
                                            key={order._id || index}
                                            className="rounded-xl shadow bg-white overflow-hidden border border-gray-200"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                            {/* Order header with status and date */}
                                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-semibold text-gray-900">Order #{order._id?.substring(order._id.length - 6).toUpperCase() || index}</h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${orderStatusClasses}`}>
                                                            {order.status || 'Processing'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Placed {dateInfo.formatted} <span className="text-gray-400">({dateInfo.relative})</span>
                                                    </p>
                                                </div>
                                                <div className="mt-2 md:mt-0 flex items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${paymentStatusClasses}`}>
                                                            {order.paymentStatus || 'Pending'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{order.paymentMethod || 'COD'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order items section */}
                                            <div className="p-4">
                                                <div className="grid gap-3">
                                                    {Array.isArray(order.items) && order.items.map((item, idx) => {
                                                        try {
                                                            // Debug custom design items
                                                            if (item.isCustomDesign) {
                                                                console.log(`Custom design item ${idx} in order ${order._id}:`, {
                                                                    isCustomDesign: item.isCustomDesign,
                                                                    customDesignId: item.customDesignId,
                                                                    designName: item.designName,
                                                                    price: item.price,
                                                                    quantity: item.quantity,
                                                                    hasPrice: !!item.price
                                                                });
                                                            }
                                                            return (
                                                                <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                                                    {/* Image section with safe rendering */}
                                                                    {(() => {
                                                                        try {
                                                                            if (item.isCustomDesign && item.customDesignImage) {
                                                                                return (
                                                                                    <div className="flex-shrink-0">
                                                                                        <Image
                                                                                            src={item.customDesignImage}
                                                                                            alt="Custom Design"
                                                                                            width={60}
                                                                                            height={60}
                                                                                            className="rounded-md shadow object-cover w-15 h-15"
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            } else if (
                                                                                item.product &&
                                                                                item.product.image &&
                                                                                Array.isArray(item.product.image) &&
                                                                                item.product.image.length > 0
                                                                            ) {
                                                                                return (
                                                                                    <a href={`/product/${item.product._id}`} className="flex-shrink-0">
                                                                                        <Image
                                                                                            src={item.product.image[0]}
                                                                                            alt={item.product.name || "Product"}
                                                                                            width={60}
                                                                                            height={60}
                                                                                            className="rounded-md shadow object-cover w-15 h-15"
                                                                                        />
                                                                                    </a>
                                                                                );
                                                                            } else {
                                                                                return (
                                                                                    <div className="w-15 h-15 bg-gray-300 rounded-md flex items-center justify-center flex-shrink-0">
                                                                                        <span className="text-xs text-gray-600">No image</span>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        } catch (err) {
                                                                            console.error("Error rendering product image:", err);
                                                                            return (
                                                                                <div className="w-15 h-15 bg-gray-300 rounded-md flex items-center justify-center flex-shrink-0">
                                                                                    <span className="text-xs text-gray-600">Error</span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    })()}

                                                                    <div className="flex-1">
                                                                        {/* Product name/title section */}
                                                                        {(() => {
                                                                            try {
                                                                                if (item.isCustomDesign) {
                                                                                    return (
                                                                                        <div>
                                                                                            <span className="font-medium text-gray-800">
                                                                                                {item.designName || (typeof item.product === 'string' ? item.product : 'Custom Design')}
                                                                                                <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 border border-blue-300 text-xs text-blue-700 font-medium">CUSTOM</span>
                                                                                            </span>
                                                                                            {item.customDesignDetails && (
                                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                                    {item.customDesignDetails.description?.substring(0, 50)}
                                                                                                    {item.customDesignDetails.description?.length > 50 ? '...' : ''}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                } else if (item.product) {
                                                                                    return (
                                                                                        <a href={item.product._id ? `/product/${item.product._id}` : '#'} className="font-medium text-gray-800 hover:text-orange-600 hover:underline">
                                                                                            {item.product.name || (typeof item.product === 'string' ? item.product : 'Product')}
                                                                                        </a>
                                                                                    );
                                                                                } else {
                                                                                    return (
                                                                                        <span className="font-medium text-gray-800">Product</span>
                                                                                    );
                                                                                }
                                                                            } catch (err) {
                                                                                console.error("Error rendering product name:", err);
                                                                                return <span className="font-medium text-gray-800">Product</span>;
                                                                            }
                                                                        })()}

                                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                                            <span className="text-sm text-gray-700">
                                                                                {currency}{(() => {
                                                                                    // Calculate unit price based on product type
                                                                                    if (item.price) {
                                                                                        return item.price;
                                                                                    } else if (item.isCustomDesign && item.customDesignId) {
                                                                                        console.warn(`Custom design order item missing price field: ${item.customDesignId}`);
                                                                                        // For legacy orders, try to calculate from order total
                                                                                        // This is a temporary fallback - new orders should have item.price
                                                                                        if (order.items && order.items.length > 0) {
                                                                                            // Simple fallback: divide order amount by total quantity
                                                                                            const totalQuantity = order.items.reduce((sum, orderItem) => sum + (orderItem.quantity || 1), 0);
                                                                                            const estimatedUnitPrice = (order.amount || 0) / totalQuantity;
                                                                                            console.log(`Using estimated price for legacy order: ₹${estimatedUnitPrice}`);
                                                                                            return estimatedUnitPrice;
                                                                                        }
                                                                                        return 0; // Fallback to 0 if calculation fails
                                                                                    } else if (item.product && typeof item.product === 'object') {
                                                                                        return item.product.offerPrice || item.product.price || 0;
                                                                                    } else {
                                                                                        return 0;
                                                                                    }
                                                                                })()} × {item.quantity || 1}
                                                                            </span>

                                                                            {/* Size badge */}
                                                                            {item.size && (
                                                                                <span className="px-2 py-1 rounded bg-orange-100 border border-orange-300 text-xs text-orange-700 font-medium uppercase">
                                                                                    Size: {item.size}
                                                                                </span>
                                                                            )}

                                                                            {/* Color display */}
                                                                            {item.color && (
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-xs text-gray-600">Color:</span>
                                                                                    {!item.isCustomDesign ? (
                                                                                        <span style={{
                                                                                            backgroundColor: item.color,
                                                                                            border: '1px solid #ccc',
                                                                                            display: 'inline-block',
                                                                                            width: 18,
                                                                                            height: 18,
                                                                                            borderRadius: '50%'
                                                                                        }} title={item.color}></span>
                                                                                    ) : (
                                                                                        <span className="text-xs text-gray-600">{item.color}</span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Item subtotal */}
                                                                    <div className="text-right flex-shrink-0">
                                                                        <div className="font-medium text-gray-900">
                                                                            {currency}{(() => {
                                                                                // Calculate total price based on product type
                                                                                let unitPrice = 0;
                                                                                if (item.price) {
                                                                                    // Use the stored price from order (preferred method)
                                                                                    unitPrice = item.price;
                                                                                } else if (item.isCustomDesign && item.customDesignId) {
                                                                                    // For legacy custom design orders without stored price
                                                                                    console.warn(`Custom design order item missing price field: ${item.customDesignId}`);
                                                                                    // Try to estimate from order total for legacy orders
                                                                                    if (order.items && order.items.length > 0) {
                                                                                        const totalQuantity = order.items.reduce((sum, orderItem) => sum + (orderItem.quantity || 1), 0);
                                                                                        unitPrice = (order.amount || 0) / totalQuantity;
                                                                                        console.log(`Using estimated price for legacy order total: ₹${unitPrice}`);
                                                                                    } else {
                                                                                        unitPrice = 0; // Fallback to 0 if calculation fails
                                                                                    }
                                                                                } else if (item.product && typeof item.product === 'object') {
                                                                                    // For populated product objects
                                                                                    unitPrice = item.product.offerPrice || item.product.price || 0;
                                                                                }
                                                                                return (unitPrice * (item.quantity || 1)).toFixed(2);
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        } catch (err) {
                                                            console.error(`Error rendering item ${idx} in order ${order._id}:`, err);
                                                            return (
                                                                <div key={idx} className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-red-500">
                                                                    Error displaying item
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                </div>
                                            </div>

                                            {/* Order footer with summary and address */}
                                            <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                                                {/* Shipping address */}
                                                <div className="flex-1">
                                                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Shipping Address</h4>
                                                    <p className="text-sm text-gray-700">
                                                        {(() => {
                                                            try {
                                                                if (typeof order.address === 'object' && order.address !== null) {
                                                                    return (
                                                                        <>
                                                                            <span className="font-medium">{order.address.fullName || 'Customer'}</span><br />
                                                                            {order.address.area || ''}{order.address.area ? ', ' : ''}
                                                                            {order.address.city || ''}{order.address.city ? ', ' : ''}
                                                                            {order.address.state || ''}
                                                                            {order.address.phoneNumber ? <><br />{order.address.phoneNumber}</> : ''}
                                                                        </>
                                                                    );
                                                                }
                                                                return 'Address details will be confirmed';
                                                            } catch (err) {
                                                                console.error("Error formatting address:", err);
                                                                return 'Address details will be confirmed';
                                                            }
                                                        })()}
                                                    </p>
                                                </div>

                                                {/* Order total */}
                                                <div className="md:text-right">
                                                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Order Total</h4>
                                                    {(() => {
                                                        const calculatedTotal = order.items?.reduce((sum, item) => {
                                                            let itemPrice = 0;
                                                            if (item.price) {
                                                                itemPrice = item.price * (item.quantity || 1);
                                                            } else if (item.isCustomDesign && order.items.length > 0) {
                                                                // Use estimation for legacy orders
                                                                const totalQuantity = order.items.reduce((s, i) => s + (i.quantity || 1), 0);
                                                                const estimatedUnitPrice = (order.amount || 0) / totalQuantity;
                                                                itemPrice = estimatedUnitPrice * (item.quantity || 1);
                                                            } else if (item.product && typeof item.product === 'object') {
                                                                itemPrice = (item.product.offerPrice || item.product.price || 0) * (item.quantity || 1);
                                                            }
                                                            return sum + itemPrice;
                                                        }, 0) || 0;

                                                        const storedTotal = order.amount || 0;
                                                        const difference = Math.abs(storedTotal - calculatedTotal);

                                                        // If there's a significant difference, use calculated total
                                                        const displayTotal = (difference > storedTotal * 0.1) ? calculatedTotal : storedTotal;
                                                        const isUsingCalculated = (difference > storedTotal * 0.1);

                                                        return (
                                                            <div className="text-xl font-bold text-orange-600">
                                                                {currency}{displayTotal.toFixed(2)}
                                                            </div>
                                                        );
                                                    })()}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Includes taxes, delivery charges
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                } catch (err) {
                                    console.error(`Failed to render order ${order?._id || index}:`, err);
                                    return (
                                        <motion.div
                                            key={`error-${index}`}
                                            className="rounded-xl shadow bg-white p-6 border border-red-200"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                        >
                                            <p className="text-red-500">There was an error displaying this order.</p>
                                            <p className="text-xs text-gray-500 mt-2">Order ID: {order?._id || 'Unknown'}</p>
                                        </motion.div>
                                    );
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;
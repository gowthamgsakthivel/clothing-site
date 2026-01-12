'use client';
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";
import axios from "axios";

const Orders = () => {
    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detailsOrder, setDetailsOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, shipped, delivered
    const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, status
    const [statusUpdateModal, setStatusUpdateModal] = useState(null); // { orderId, currentStatus }
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Status workflow progression
    const statusWorkflow = {
        'Order Placed': 'Packed',
        'Processing': 'Packed',
        'Pending': 'Packed',
        'Packed': 'Shipped',
        'Shipped': 'In Transit',
        'In Transit': 'Out for Delivery',
        'Out for Delivery': 'Delivered',
        'Delivered': null,
        'Completed': null
    };

    // Get the next status in workflow
    const getNextStatus = (currentStatus) => {
        return statusWorkflow[currentStatus] || null;
    };

    // Get status color and badge style
    const getStatusStyle = (status) => {
        const styles = {
            'Order Placed': { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-500' },
            'Processing': { bg: 'bg-indigo-100', text: 'text-indigo-800', badge: 'bg-indigo-500' },
            'Pending': { bg: 'bg-blue-100', text: 'text-blue-800', badge: 'bg-blue-500' },
            'Packed': { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: 'bg-yellow-500' },
            'Shipped': { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-500' },
            'In Transit': { bg: 'bg-orange-100', text: 'text-orange-800', badge: 'bg-orange-500' },
            'Out for Delivery': { bg: 'bg-purple-100', text: 'text-purple-800', badge: 'bg-purple-500' },
            'Delivered': { bg: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-500' },
            'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-800', badge: 'bg-emerald-500' }
        };
        return styles[status] || styles['Order Placed'];
    };

    // Update order status
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setUpdatingStatus(true);
            const token = await getToken();

            const response = await axios.post(
                '/api/order/update-status',
                { orderId, newStatus },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                // Update local state
                setOrders(orders.map(order =>
                    order._id === orderId ? { ...order, status: newStatus } : order
                ));
                toast.success(`Order marked as ${newStatus}`);
                setStatusUpdateModal(null);
            } else {
                toast.error(response.data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error updating order status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Enhanced fetch function with error handling
    const fetchSellerOrders = async (status = 'all', sort = 'date-desc') => {
        try {
            setLoading(true);
            setError(null);

            console.log("Fetching seller orders...");

            // Check if user is available
            if (!user?.id) {
                console.log("User not available yet, waiting...");
                setError("User authentication not ready. Please wait or refresh the page.");
                return;
            }

            console.log("Getting auth token for user:", user.id);
            const token = await getToken();

            console.log("Token received:", {
                hasToken: !!token,
                tokenType: typeof token,
                tokenLength: token?.length,
                tokenStart: token?.substring(0, 20)
            });

            if (!token) {
                console.log("No token available");
                setError("Authentication failed. Please sign in again.");
                return;
            }

            // Build query string with filters
            const params = new URLSearchParams();
            params.append('status', status);
            params.append('sortBy', sort);

            console.log("Making API request to /api/order/seller-orders with filters:", { status, sort });
            const response = await axios.get(`/api/order/seller-orders?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000, // 15 second timeout
                validateStatus: function (status) {
                    // Accept all status codes to handle them manually
                    console.log('API Response status:', status);
                    return true;
                }
            });

            console.log("Seller orders API response status:", response.status);
            console.log("Seller orders API response data:", response.data);

            if (response.status === 401) {
                setError("Authentication failed. Please sign in again.");
                toast.error("Authentication failed. Please sign in again.");
                return;
            }

            if (response.status === 403) {
                setError("Access denied. Seller permissions required.");
                toast.error("Access denied. You need seller permissions to view orders.");
                return;
            }

            if (response.status >= 400) {
                const errorMsg = response.data?.message || `Server error (${response.status})`;
                setError(errorMsg);
                toast.error(errorMsg);
                return;
            }

            const data = response.data;

            if (data.success) {
                // Defensive check for orders data
                if (Array.isArray(data.orders)) {
                    console.log(`Successfully loaded ${data.orders.length} orders`);
                    setOrders(data.orders);
                    if (data.orders.length === 0) {
                        console.log("No orders found for this seller");
                    }
                } else {
                    console.warn("Orders data is not an array:", data.orders);
                    setOrders([]);
                    setError("Received invalid orders data format");
                }
            } else {
                console.error("API returned error:", data.message);
                const errorMsg = data.message || "Failed to load orders";
                toast.error(errorMsg);
                setError(errorMsg);
            }
        } catch (error) {
            console.error("Error fetching seller orders:", error);

            if (error.code === 'ECONNREFUSED') {
                setError("Cannot connect to server. Please check if the server is running.");
                toast.error("Server connection failed");
            } else if (error.code === 'ECONNABORTED') {
                setError("Request timed out. Please try again.");
                toast.error("Request timed out");
            } else if (error.response) {
                // Server responded with error status
                const errorMsg = error.response.data?.message || `Server error (${error.response.status})`;
                setError(errorMsg);
                toast.error(errorMsg);
            } else if (error.request) {
                // Request was made but no response received
                setError("No response from server. Please check your internet connection.");
                toast.error("Network error - no response from server");
            } else {
                // Something else happened
                const errorMessage = error.message || "Unknown error occurred";
                setError(`Network error: ${errorMessage}`);
                toast.error(`Error: ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch orders when user is available or filters change
    useEffect(() => {
        if (user?.id) {
            fetchSellerOrders(statusFilter, sortBy);
        } else if (user === null) {
            setLoading(false);
            setError("Please sign in to view your seller orders");
        }
        // Keep loading state while user is being fetched
    }, [user, getToken, statusFilter, sortBy]); return (
        <div className="w-full h-screen overflow-auto flex flex-col justify-between text-sm bg-gray-50">
            {!user ? (
                <div className="md:p-10 p-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-700">
                        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
                        <p>Please sign in to view your seller orders.</p>
                    </div>
                </div>
            ) : loading ? (
                <Loading />
            ) : error ? (
                <div className="md:p-10 p-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                        <h3 className="text-lg font-medium mb-2">Error Loading Orders</h3>
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={() => fetchSellerOrders(statusFilter, sortBy)}
                            className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            ) : (
                <div className="md:p-10 p-4 space-y-5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium">Orders</h2>
                        <button
                            onClick={() => fetchSellerOrders(statusFilter, sortBy)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Refresh Orders'}
                        </button>
                    </div>

                    {/* Filter Controls */}
                    <div className="bg-white rounded-md border border-gray-200 p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Orders</option>
                                    <option value="pending">Pending / Processing</option>
                                    <option value="shipped">Shipped / In Transit</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="date-desc">Newest First</option>
                                    <option value="date-asc">Oldest First</option>
                                    <option value="status">By Status</option>
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setSortBy('date-desc');
                                    }}
                                    className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-md border border-gray-200 p-8 text-center text-gray-500">
                            <p>No orders found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-left">Order ID</th>
                                        <th className="px-4 py-3 font-medium text-left">Products</th>
                                        <th className="px-4 py-3 font-medium text-left">Date</th>
                                        <th className="px-4 py-3 font-medium text-left">Status</th>
                                        <th className="px-4 py-3 font-medium text-left">Amount</th>
                                        <th className="px-4 py-3 font-medium text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, index) => {
                                        try {
                                            return (
                                                <tr key={order._id || index} className="border-t border-gray-200">
                                                    <td className="px-4 py-3 font-mono text-xs">{order._id || 'N/A'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                                                <>
                                                                    {/* Show first product image */}
                                                                    {order.items[0].product?.image?.[0] ? (
                                                                        <img
                                                                            src={order.items[0].product.image[0]}
                                                                            alt={order.items[0].product?.name || 'Product'}
                                                                            className="w-12 h-12 object-cover rounded border"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                                                            No Image
                                                                        </div>
                                                                    )}
                                                                    {/* Show product count if multiple items */}
                                                                    {order.items.length > 1 && (
                                                                        <span className="text-xs text-gray-500">+{order.items.length - 1} more</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                                                    No Items
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{(() => {
                                                        try {
                                                            // Helper function to format date safely
                                                            const formatDate = (timestamp) => {
                                                                try {
                                                                    const date = new Date(timestamp * 1000);
                                                                    if (isNaN(date.getTime())) {
                                                                        return 'Invalid Date';
                                                                    }
                                                                    return date.toISOString().split('T')[0];
                                                                } catch {
                                                                    return 'Invalid Date';
                                                                }
                                                            };

                                                            // If we have a valid number, use it
                                                            if (typeof order.date === 'number' && !isNaN(order.date) && order.date > 0) {
                                                                return formatDate(order.date);
                                                            }

                                                            // If it's a string that looks like a number, convert it
                                                            if (typeof order.date === 'string' && /^\d+$/.test(order.date)) {
                                                                const timestamp = parseInt(order.date, 10);
                                                                if (!isNaN(timestamp) && timestamp > 0) {
                                                                    return formatDate(timestamp);
                                                                }
                                                            }

                                                            // For other string formats, try direct parsing
                                                            if (typeof order.date === 'string' && order.date.length > 0) {
                                                                const parsed = new Date(order.date);
                                                                if (!isNaN(parsed.getTime())) {
                                                                    return parsed.toISOString().split('T')[0];
                                                                }
                                                            }

                                                            return new Date().toISOString().split('T')[0];
                                                        } catch (err) {
                                                            return new Date().toISOString().split('T')[0];
                                                        }
                                                    })()}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(order.status).bg} ${getStatusStyle(order.status).text}`}>
                                                            {order.status || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">{currency}{order.amount || 0}</td>
                                                    <td className="px-4 py-3 space-x-2 flex flex-wrap gap-2">
                                                        <button
                                                            className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-800"
                                                            onClick={() => setDetailsOrder(order)}
                                                        >
                                                            View
                                                        </button>
                                                        {getNextStatus(order.status) && (
                                                            <button
                                                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition"
                                                                onClick={() => setStatusUpdateModal({ orderId: order._id, currentStatus: order.status })}
                                                            >
                                                                Mark as {getNextStatus(order.status)}
                                                            </button>
                                                        )}
                                                        {!getNextStatus(order.status) && (
                                                            <span className="text-xs text-gray-500 px-2 py-1.5">
                                                                ✓ Complete
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        } catch (err) {
                                            console.error(`Error rendering order row ${index}:`, err);
                                            return (
                                                <tr key={`error-${index}`} className="border-t border-gray-200">
                                                    <td colSpan="5" className="px-4 py-3 text-red-500">
                                                        Error displaying order
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Order Details Modal */}
            {detailsOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setDetailsOrder(null)}>&times;</button>
                        <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                        <div className="mb-2 text-xs text-gray-500">Order ID: <span className="font-mono">{detailsOrder._id}</span></div>
                        <div className="mb-2">Date: {(() => {
                            try {
                                // Helper function to format date safely
                                const formatDate = (timestamp) => {
                                    try {
                                        const date = new Date(timestamp * 1000);
                                        if (isNaN(date.getTime())) {
                                            return 'Invalid Date';
                                        }
                                        return date.toISOString().split('T')[0];
                                    } catch {
                                        return 'Invalid Date';
                                    }
                                };

                                // If we have a valid number, use it
                                if (typeof detailsOrder.date === 'number' && !isNaN(detailsOrder.date) && detailsOrder.date > 0) {
                                    return formatDate(detailsOrder.date);
                                }

                                // If it's a string that looks like a number, convert it
                                if (typeof detailsOrder.date === 'string' && /^\d+$/.test(detailsOrder.date)) {
                                    const timestamp = parseInt(detailsOrder.date, 10);
                                    if (!isNaN(timestamp) && timestamp > 0) {
                                        return formatDate(timestamp);
                                    }
                                }

                                // For other string formats, try direct parsing
                                if (typeof detailsOrder.date === 'string' && detailsOrder.date.length > 0) {
                                    const parsed = new Date(detailsOrder.date);
                                    if (!isNaN(parsed.getTime())) {
                                        return parsed.toISOString().split('T')[0];
                                    }
                                }

                                return new Date().toISOString().split('T')[0];
                            } catch (err) {
                                return new Date().toISOString().split('T')[0];
                            }
                        })()}</div>
                        <div className="mb-2">Status: <span className="font-semibold">{detailsOrder.paymentStatus || 'Unknown'}</span></div>
                        <div className="mb-2">Amount: <span className="font-semibold">{currency}{detailsOrder.amount || 0}</span></div>
                        <div className="mb-2">Customer: <span className="font-semibold">{detailsOrder.address?.fullName || 'Customer'}</span></div>
                        <div className="mb-4">Address: {detailsOrder.address ?
                            `${detailsOrder.address.area || ''}, ${detailsOrder.address.city || ''}, ${detailsOrder.address.state || ''} ${detailsOrder.address.phoneNumber ? `- ${detailsOrder.address.phoneNumber}` : ''}`
                            : 'Address not available'}
                        </div>
                        <div>
                            <table className="min-w-full text-xs border">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-2 py-1 text-left">Image</th>
                                        <th className="px-2 py-1 text-left">Product</th>
                                        <th className="px-2 py-1 text-left">Qty</th>
                                        <th className="px-2 py-1 text-left">Color</th>
                                        <th className="px-2 py-1 text-left">Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(detailsOrder.items) ? detailsOrder.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-2 py-1">
                                                {item.product?.image?.[0] ? (
                                                    <img
                                                        src={item.product.image[0]}
                                                        alt={item.product?.name || 'Product'}
                                                        className="w-8 h-8 object-cover rounded border"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">
                                                        No Img
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-1">
                                                {item.product?.name || item.product || 'Unknown Product'}
                                            </td>
                                            <td className="px-2 py-1">{item.quantity || 1}</td>
                                            <td className="px-2 py-1">
                                                {item.color ? (
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            style={{
                                                                backgroundColor: item.color !== 'N/A' ? item.color : '#ccc',
                                                                border: '1px solid #ccc',
                                                                display: 'inline-block',
                                                                width: 16,
                                                                height: 16,
                                                                borderRadius: '50%'
                                                            }}
                                                            title={item.color}
                                                        ></span>
                                                        {item.isCustomDesign && <span className="text-[10px]">{item.color}</span>}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-2 py-1">{item.size || '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-2 py-1 text-center text-red-500">
                                                No items found in this order
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {statusUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
                            onClick={() => setStatusUpdateModal(null)}
                        >
                            ×
                        </button>

                        <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>

                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <p className="text-sm text-gray-600">Current Status:</p>
                                <p className={`text-base font-semibold ${getStatusStyle(statusUpdateModal.currentStatus).text}`}>
                                    {statusUpdateModal.currentStatus}
                                </p>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm text-gray-600 mb-3">Next Status:</p>
                                <p className={`text-lg font-bold ${getStatusStyle(getNextStatus(statusUpdateModal.currentStatus)).text}`}>
                                    {getNextStatus(statusUpdateModal.currentStatus)}
                                </p>
                            </div>

                            {/* Status progression info */}
                            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                                <p className="font-semibold mb-2">📦 Order Workflow:</p>
                                <div className="space-y-1">
                                    <p>1️⃣ Order Placed → 2️⃣ Packed → 3️⃣ Shipped →</p>
                                    <p>4️⃣ In Transit → 5️⃣ Out for Delivery → 6️⃣ Delivered</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition text-sm font-medium"
                                    onClick={() => setStatusUpdateModal(null)}
                                    disabled={updatingStatus}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium disabled:bg-gray-400"
                                    onClick={() => updateOrderStatus(statusUpdateModal.orderId, getNextStatus(statusUpdateModal.currentStatus))}
                                    disabled={updatingStatus}
                                >
                                    {updatingStatus ? 'Updating...' : 'Confirm Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Orders;

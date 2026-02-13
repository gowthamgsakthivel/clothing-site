'use client';
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [statusUpdateModal, setStatusUpdateModal] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

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

    const getNextStatus = (currentStatus) => {
        return statusWorkflow[currentStatus] || null;
    };

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

    const fetchOwnerOrders = useCallback(async (status = 'all', sort = 'date-desc') => {
        try {
            setLoading(true);
            setError(null);

            if (!user?.id) {
                setError("User authentication not ready. Please wait or refresh the page.");
                return;
            }

            const token = await getToken();

            if (!token) {
                setError("Authentication failed. Please sign in again.");
                return;
            }

            const params = new URLSearchParams();
            params.append('status', status);
            params.append('sortBy', sort);

            const response = await axios.get(`/api/order/seller-orders?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000,
                validateStatus: function (status) {
                    return true;
                }
            });

            if (response.status === 401) {
                setError("Authentication failed. Please sign in again.");
                toast.error("Authentication failed. Please sign in again.");
                return;
            }

            if (response.status === 403) {
                setError("Access denied. Permissions required.");
                toast.error("Access denied. Permissions required.");
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
                if (Array.isArray(data.orders)) {
                    setOrders(data.orders);
                } else {
                    setOrders([]);
                    setError("Received invalid orders data format");
                }
            } else {
                const errorMsg = data.message || "Failed to load orders";
                toast.error(errorMsg);
                setError(errorMsg);
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                setError("Cannot connect to server. Please check if the server is running.");
                toast.error("Server connection failed");
            } else if (error.code === 'ECONNABORTED') {
                setError("Request timed out. Please try again.");
                toast.error("Request timed out");
            } else if (error.response) {
                const errorMsg = error.response.data?.message || `Server error (${error.response.status})`;
                setError(errorMsg);
                toast.error(errorMsg);
            } else if (error.request) {
                setError("No response from server. Please check your internet connection.");
                toast.error("Network error - no response from server");
            } else {
                const errorMessage = error.message || "Unknown error occurred";
                setError(`Network error: ${errorMessage}`);
                toast.error(`Error: ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
    }, [getToken, user]);

    useEffect(() => {
        if (user?.id) {
            fetchOwnerOrders(statusFilter, sortBy);
        } else if (user === null) {
            setLoading(false);
            setError("Please sign in to view your orders");
        }
    }, [user, statusFilter, sortBy, fetchOwnerOrders]); return (
        <div className="w-full h-screen overflow-auto flex flex-col justify-between text-sm bg-gray-50">
            {!user ? (
                <div className="md:p-10 p-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-700">
                        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
                        <p>Please sign in to view your orders.</p>
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
                            onClick={() => fetchOwnerOrders(statusFilter, sortBy)}
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
                            onClick={() => fetchOwnerOrders(statusFilter, sortBy)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Refresh Orders'}
                        </button>
                    </div>

                    <div className="bg-white rounded-md border border-gray-200 p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                                                    {order.items[0].product?.image?.[0] ? (
                                                                        <Image
                                                                            src={order.items[0].product.image[0]}
                                                                            alt={order.items[0].product?.name || 'Product'}
                                                                            width={48}
                                                                            height={48}
                                                                            className="w-12 h-12 object-cover rounded border"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                                                            No Image
                                                                        </div>
                                                                    )}
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

                                                            if (typeof order.date === 'number' && !isNaN(order.date) && order.date > 0) {
                                                                return formatDate(order.date);
                                                            }

                                                            if (typeof order.date === 'string' && /^\d+$/.test(order.date)) {
                                                                const timestamp = parseInt(order.date, 10);
                                                                if (!isNaN(timestamp) && timestamp > 0) {
                                                                    return formatDate(timestamp);
                                                                }
                                                            }

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

            {detailsOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setDetailsOrder(null)}>&times;</button>
                        <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                        <div className="mb-2 text-xs text-gray-500">Order ID: <span className="font-mono">{detailsOrder._id}</span></div>
                        <div className="mb-2">Date: {(() => {
                            try {
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

                                if (typeof detailsOrder.date === 'number' && !isNaN(detailsOrder.date) && detailsOrder.date > 0) {
                                    return formatDate(detailsOrder.date);
                                }

                                if (typeof detailsOrder.date === 'string' && /^\d+$/.test(detailsOrder.date)) {
                                    const timestamp = parseInt(detailsOrder.date, 10);
                                    if (!isNaN(timestamp) && timestamp > 0) {
                                        return formatDate(timestamp);
                                    }
                                }

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
                                                    <Image
                                                        src={item.product.image[0]}
                                                        alt={item.product?.name || 'Product'}
                                                        width={32}
                                                        height={32}
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

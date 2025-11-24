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

    // Enhanced fetch function with error handling
    const fetchSellerOrders = async () => {
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

            console.log("Making API request to /api/order/seller-orders with token:", token?.substring(0, 10) + '...');
            const response = await axios.get('/api/order/seller-orders', {
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

    // Fetch orders when user is available
    useEffect(() => {
        if (user?.id) {
            fetchSellerOrders();
        } else if (user === null) {
            setLoading(false);
            setError("Please sign in to view your seller orders");
        }
        // Keep loading state while user is being fetched
    }, [user, getToken]); return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm bg-gray-50">
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
                            onClick={fetchSellerOrders}
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
                            onClick={fetchSellerOrders}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Refresh Orders'}
                        </button>
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
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'Paid' || order.paymentStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                            order.paymentStatus === 'Pending' || order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                order.paymentStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-200 text-gray-700'
                                                            }`}>{order.paymentStatus || 'Unknown'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">{currency}{order.amount || 0}</td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            className="bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-800"
                                                            onClick={() => setDetailsOrder(order)}
                                                        >
                                                            View Details
                                                        </button>
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

            <Footer />
        </div>
    );
};

export default Orders;
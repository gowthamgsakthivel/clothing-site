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
            const token = await getToken();

            const { data } = await axios.get('/api/order/seller-orders', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000 // 10 second timeout
            });

            console.log("Seller orders API response:", data);

            if (data.success) {
                // Defensive check for orders data
                if (Array.isArray(data.orders)) {
                    // Debug order dates
                    console.log("Order dates:", data.orders.map(order => ({
                        orderId: order._id,
                        dateValue: order.date,
                        dateType: typeof order.date,
                        attempt: order.date ? new Date(order.date * 1000).toString() : 'No date'
                    })));

                    setOrders(data.orders);
                } else {
                    console.warn("Orders data is not an array:", data.orders);
                    setOrders([]);
                    setError("Received invalid orders data");
                }
            } else {
                console.error("API returned error:", data.message);
                toast.error(data.message || "Failed to load orders");
                setError(data.message || "Failed to load orders");
            }
        } catch (error) {
            console.error("Error fetching seller orders:", error);
            const errorMessage = error.response?.data?.message || error.message || "Unknown error";
            toast.error(`Error: ${errorMessage}`);
            setError(`Failed to load orders: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch orders when user is available
    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm bg-gray-50">
            {loading ? (
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
                    <h2 className="text-lg font-medium mb-4">Orders</h2>

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
                                                    <td className="px-4 py-3">{(() => {
                                                        try {
                                                            // For debugging
                                                            console.log(`Formatting date for order ${order._id}:`, order.date, typeof order.date);

                                                            // Simple helper function to format date
                                                            const formatDate = (timestamp) => {
                                                                const date = new Date(timestamp * 1000); // Convert seconds to ms
                                                                return date.toISOString().split('T')[0]; // YYYY-MM-DD
                                                            };

                                                            // If we have a valid number, use it
                                                            if (order.date && typeof order.date === 'number') {
                                                                return formatDate(order.date);
                                                            }

                                                            // If it's a string that looks like a number, convert it
                                                            if (order.date && typeof order.date === 'string' && /^\d+$/.test(order.date)) {
                                                                return formatDate(parseInt(order.date, 10));
                                                            }

                                                            // For other string formats, try direct parsing
                                                            if (order.date && typeof order.date === 'string') {
                                                                const parsed = new Date(order.date);
                                                                if (parsed.toString() !== 'Invalid Date') {
                                                                    return parsed.toISOString().split('T')[0];
                                                                }
                                                            }

                                                            return 'N/A';
                                                        } catch (err) {
                                                            console.error("Error formatting date:", err, order.date);
                                                            return 'Invalid Date';
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
                                // Simple helper function to format date
                                const formatDate = (timestamp) => {
                                    const date = new Date(timestamp * 1000); // Convert seconds to ms
                                    return date.toISOString().split('T')[0]; // YYYY-MM-DD
                                };

                                // If we have a valid number, use it
                                if (detailsOrder.date && typeof detailsOrder.date === 'number') {
                                    return formatDate(detailsOrder.date);
                                }

                                // If it's a string that looks like a number, convert it
                                if (detailsOrder.date && typeof detailsOrder.date === 'string' && /^\d+$/.test(detailsOrder.date)) {
                                    return formatDate(parseInt(detailsOrder.date, 10));
                                }

                                // For other string formats, try direct parsing
                                if (detailsOrder.date && typeof detailsOrder.date === 'string') {
                                    const parsed = new Date(detailsOrder.date);
                                    if (parsed.toString() !== 'Invalid Date') {
                                        return parsed.toISOString().split('T')[0];
                                    }
                                }

                                return 'N/A';
                            } catch (err) {
                                console.error("Error formatting date:", err, detailsOrder.date);
                                return 'Invalid Date';
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
                                                {item.isCustomDesign ? (
                                                    <span>
                                                        {item.product}
                                                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">CUSTOM</span>
                                                    </span>
                                                ) : (
                                                    item.product?.name || item.product || 'Unknown Product'
                                                )}
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
                                            <td colSpan="4" className="px-2 py-1 text-center text-red-500">
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
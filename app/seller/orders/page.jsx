'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
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

    const fetchSellerOrders = async () => {

        try {

            const token = await getToken();
            const { data } = await axios.get('/api/order/seller-orders', { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                setOrders(data.orders)
                setLoading(false)
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    // Modal state for details
    const [detailsOrder, setDetailsOrder] = useState(null);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm bg-gray-50">
            {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
                <h2 className="text-lg font-medium mb-4">Orders</h2>
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
                            {orders.map((order, index) => (
                                <tr key={order._id} className="border-t border-gray-200">
                                    <td className="px-4 py-3 font-mono text-xs">{order._id}</td>
                                    <td className="px-4 py-3">{new Date(order.date).toISOString().slice(0, 10)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'confirmed' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'pending' ? 'bg-black text-white' : order.paymentStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{order.paymentStatus}</span>
                                    </td>
                                    <td className="px-4 py-3">{currency}{order.amount}</td>
                                    <td className="px-4 py-3">
                                        <button className="bg-gray-900 text-white px-4 py-1.5 rounded" onClick={() => setDetailsOrder(order)}>View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Details Modal */}
                {detailsOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
                            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setDetailsOrder(null)}>&times;</button>
                            <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                            <div className="mb-2 text-xs text-gray-500">Order ID: <span className="font-mono">{detailsOrder._id}</span></div>
                            <div className="mb-2">Date: {new Date(detailsOrder.date).toLocaleDateString()}</div>
                            <div className="mb-2">Status: <span className="font-semibold">{detailsOrder.paymentStatus}</span></div>
                            <div className="mb-2">Amount: <span className="font-semibold">{currency}{detailsOrder.amount}</span></div>
                            <div className="mb-2">Customer: <span className="font-semibold">{detailsOrder.address?.fullName}</span></div>
                            <div className="mb-4">Address: {detailsOrder.address?.area}, {detailsOrder.address?.city}, {detailsOrder.address?.state} - {detailsOrder.address?.phoneNumber}</div>
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
                                        {detailsOrder.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-2 py-1">{item.product?.name || item.product}</td>
                                                <td className="px-2 py-1">{item.quantity}</td>
                                                <td className="px-2 py-1">
                                                    {item.color ? <span style={{ backgroundColor: item.color, border: '1px solid #ccc', display: 'inline-block', width: 16, height: 16, borderRadius: '50%' }} title={item.color}></span> : '-'}
                                                </td>
                                                <td className="px-2 py-1">{item.size || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>}
            <Footer />
        </div>
    );
};

export default Orders;
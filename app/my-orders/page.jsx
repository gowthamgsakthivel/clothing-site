'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const MyOrders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {

            const token = await getToken();

            const { data } = await axios.get('/api/order/list', { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                setOrders(data.orders.reverse());
                setLoading(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-2 md:px-8 lg:px-32 py-6 min-h-screen bg-gray-50">
                <div className="space-y-5 max-w-5xl mx-auto w-full">
                    <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-800">My Orders</h2>
                    {loading ? <Loading /> : (
                        <div className="grid gap-6">
                            {orders.map((order, index) => (
                                <div key={index} className="rounded-xl shadow bg-white p-6 flex flex-col md:flex-row md:items-center gap-6 border border-gray-200">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-4 items-center">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
                                                    {item.product.image && (
                                                        <a href={`/product/${item.product._id}`} className="block">
                                                            <Image
                                                                src={item.product.image[0]}
                                                                alt={item.product.name}
                                                                width={40}
                                                                height={40}
                                                                className="rounded shadow object-cover w-10 h-10"
                                                            />
                                                        </a>
                                                    )}
                                                    <a href={`/product/${item.product._id}`} className="font-medium text-gray-800 text-sm hover:underline">
                                                        {item.product.name || item.product}
                                                    </a>
                                                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                                                    {item.color && (
                                                        <span style={{ backgroundColor: item.color, border: '1px solid #ccc', display: 'inline-block', width: 18, height: 18, borderRadius: '50%' }} title={item.color}></span>
                                                    )}
                                                    {item.size && (
                                                        <span className="ml-1 px-2 py-0.5 rounded bg-orange-100 border border-orange-300 text-xs text-orange-700 font-semibold uppercase">{item.size}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                                            <span>Order ID: <span className="font-mono text-gray-700">{order._id}</span></span>
                                            <span>Date: {new Date(order.date).toLocaleDateString()}</span>
                                            <span>Items: {order.items.length}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[180px]">
                                        <div className="text-lg font-bold text-orange-600">{currency}{order.amount}</div>
                                        <div className="flex gap-2 items-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === 'confirmed' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'pending' ? 'bg-black text-white' : order.paymentStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{order.paymentStatus}</span>
                                            <span className="text-xs text-gray-500">{order.paymentMethod || 'COD'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{order.address.fullName}, {order.address.area}, {order.address.city}, {order.address.state} - {order.address.phoneNumber}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;
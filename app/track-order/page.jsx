'use client';
import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';

const mockOrder = {
    id: 'SS-2026-01872',
    statusIndex: 2,
    statusSteps: ['Order Placed', 'Order Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'],
    eta: 'Feb 10, 2026',
    courier: 'Sparrow Express',
    trackingId: 'SPX-772019',
    address: {
        name: 'Arun Kumar',
        line1: '12/4 Lake View Road',
        line2: 'MG Nagar',
        city: 'Chennai',
        state: 'TN',
        zip: '600034',
        phone: '+91 98765 43210',
    },
    items: [
        {
            id: 'p1',
            name: 'PUMA Men’s Standard BMW M Motorsport Polo',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
            size: 'M',
            color: 'White',
            qty: 1,
            price: 3500,
        },
        {
            id: 'p2',
            name: 'Sparrow Sports Training Shorts',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
            size: 'L',
            color: 'Black',
            qty: 2,
            price: 899,
        },
    ],
};

const StatusTimeline = ({ steps, current }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {steps.map((step, idx) => {
                const isComplete = idx <= current;
                return (
                    <div key={step} className="flex md:flex-col items-center md:items-start gap-3 flex-1">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {idx + 1}
                        </div>
                        <div className="flex-1 w-full">
                            <p className={`text-xs md:text-sm font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>{step}</p>
                            <div className="mt-2 hidden md:block h-1 w-full rounded-full bg-gray-100">
                                <div className={`h-1 rounded-full ${isComplete ? 'bg-orange-600' : 'bg-gray-200'}`} style={{ width: isComplete ? '100%' : '0%' }} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const OrderItem = ({ item }) => (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-gray-100">
            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-5 max-h-10 overflow-hidden">{item.name}</p>
            <p className="text-xs text-gray-600 mt-1">Size: {item.size} • Color: {item.color} • Qty: {item.qty}</p>
        </div>
        <div className="text-right text-sm font-semibold text-gray-900">₹{item.price}</div>
    </div>
);

const TrackOrderContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialOrderId = searchParams.get('orderId') || '';
    const [orderId, setOrderId] = useState(initialOrderId);
    const [order, setOrder] = useState(initialOrderId ? mockOrder : null);
    const [loading, setLoading] = useState(false);

    const totalItems = useMemo(() => (order?.items || []).reduce((sum, item) => sum + item.qty, 0), [order]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!orderId.trim()) return;
        setLoading(true);
        setTimeout(() => {
            setOrder(mockOrder);
            setLoading(false);
            router.replace(`/track-order?orderId=${orderId.trim()}`);
        }, 500);
    };

    return (
        <>
            <Navbar />
            <SEOMetadata
                title="Track Order | Sparrow Sports"
                description="Track your Sparrow Sports order status and delivery details."
                keywords="track order, order status, delivery tracking"
                url="/track-order"
            />
            <div className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-16">
                <div className="px-4 sm:px-6 md:px-16 lg:px-32 max-w-5xl mx-auto space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Track Your Order</h1>
                        <p className="text-sm text-gray-600 mt-2">Enter your order ID to view live status updates.</p>
                        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-3">
                            <input
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="e.g. SS-2026-01872"
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-orange-700 transition"
                            >
                                {loading ? 'Checking…' : 'Track Order'}
                            </button>
                        </form>
                    </div>

                    {!order && !loading && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                            <p className="text-gray-700 font-semibold">Enter an order ID to begin tracking.</p>
                            <p className="text-sm text-gray-500 mt-1">You’ll see live delivery updates and item details here.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 w-40 bg-gray-200 rounded mx-auto" />
                                <div className="h-4 w-56 bg-gray-200 rounded mx-auto" />
                            </div>
                        </div>
                    )}

                    {order && !loading && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Order ID</p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">{order.id}</p>
                                        <p className="text-sm text-gray-600 mt-2">Courier: {order.courier}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">ETA</p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">{order.eta}</p>
                                        <p className="text-sm text-gray-600 mt-2">Tracking ID: {order.trackingId}</p>
                                    </div>
                                </div>
                            </div>

                            <StatusTimeline steps={order.statusSteps} current={order.statusIndex} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                    <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                                    <p className="text-sm text-gray-700 mt-3 font-semibold">{order.address.name}</p>
                                    <p className="text-sm text-gray-600">{order.address.line1}</p>
                                    <p className="text-sm text-gray-600">{order.address.line2}</p>
                                    <p className="text-sm text-gray-600">{order.address.city}, {order.address.state} {order.address.zip}</p>
                                    <p className="text-sm text-gray-600 mt-1">{order.address.phone}</p>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                    <h2 className="text-lg font-semibold text-gray-900">Items ({totalItems})</h2>
                                    <div className="mt-4 space-y-3">
                                        {order.items.map((item) => (
                                            <OrderItem key={item.id} item={item} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

const TrackOrderPage = () => (
    <Suspense
        fallback={
            <div className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-16">
                <div className="px-4 sm:px-6 md:px-16 lg:px-32 max-w-5xl mx-auto">
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                        <p className="text-gray-700 font-semibold">Loading tracking details…</p>
                    </div>
                </div>
            </div>
        }
    >
        <TrackOrderContent />
    </Suspense>
);

export default TrackOrderPage;

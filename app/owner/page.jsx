'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Box, DollarSign, Mail, PackageCheck, ShoppingBag, Users } from 'lucide-react';

const OwnerDashboard = () => {
    const { getToken, user } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalContacts: 0,
        recentOrders: [],
        ordersByStatus: {},
    });

    const fetchOwnerStats = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const response = await axios.get('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStats(response.data.data);
            } else {
                toast.error(response.data.message || 'Failed to fetch stats');
            }
        } catch (error) {
            console.error('Error fetching owner stats:', error);
            toast.error('Failed to load owner dashboard');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (user) {
            fetchOwnerStats();
        }
    }, [user, fetchOwnerStats]);

    const statusCards = useMemo(() => ([
        { key: 'placed', label: 'Placed', dot: 'bg-blue-500' },
        { key: 'packed', label: 'Packed', dot: 'bg-amber-500' },
        { key: 'shipped', label: 'Shipped', dot: 'bg-indigo-500' },
        { key: 'delivered', label: 'Delivered', dot: 'bg-emerald-500' },
        { key: 'rto', label: 'RTO', dot: 'bg-orange-500' },
        { key: 'failed', label: 'Failed', dot: 'bg-rose-500' }
    ]), []);

    const metricCards = useMemo(() => ([
        {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            accent: 'text-emerald-600 bg-emerald-50'
        },
        {
            label: 'Orders',
            value: stats.totalOrders,
            icon: ShoppingBag,
            accent: 'text-blue-600 bg-blue-50'
        },
        {
            label: 'Customers',
            value: stats.totalUsers,
            icon: Users,
            accent: 'text-purple-600 bg-purple-50'
        },
        {
            label: 'Active Products',
            value: stats.totalProducts,
            icon: Box,
            accent: 'text-amber-600 bg-amber-50'
        },
        {
            label: 'Unread Messages',
            value: stats.totalContacts,
            icon: Mail,
            accent: 'text-rose-600 bg-rose-50'
        }
    ]), [stats]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
                <p className="text-sm text-slate-500">Welcome back, here is what is happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {metricCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+5%</span>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-500">{card.label}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Orders by Status</h3>
                        <Link href="/owner/orders-v2" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            View all orders
                        </Link>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {statusCards.map((card) => (
                                <div key={card.key} className="flex flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                                    <span className={`h-2 w-2 rounded-full ${card.dot}`} />
                                    <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</span>
                                    <span className="mt-1 text-lg font-bold text-slate-900">{stats.ordersByStatus?.[card.key] ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
                            <button className="text-sm text-slate-400 hover:text-slate-600">...</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Order ID</th>
                                        <th className="px-6 py-3">Customer</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {stats.recentOrders.slice(0, 5).map((order) => (
                                        <tr key={order._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">#{order._id.slice(-6).toUpperCase()}</td>
                                            <td className="px-6 py-4 text-slate-600">{order.userId || 'N/A'}</td>
                                            <td className="px-6 py-4 text-slate-500">{order.date ? new Date(order.date * 1000).toLocaleDateString() : '-'}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">₹{order.amount?.toLocaleString() || 0}</td>
                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                                    {order.status || 'Processing'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link href="/owner/add-product" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Box className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Add Product</p>
                                <p className="text-xs text-slate-500">Update inventory catalog</p>
                            </div>
                        </Link>
                        <Link href="/owner/orders-v2" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <PackageCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Create Order</p>
                                <p className="text-xs text-slate-500">Manual order entry</p>
                            </div>
                        </Link>
                        <Link href="/owner/orders-v2" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Process Returns</p>
                                <p className="text-xs text-slate-500">Handle RMAs & refunds</p>
                            </div>
                        </Link>
                        <Link href="/owner/analytics-v2" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <PackageCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">View Analytics</p>
                                <p className="text-xs text-slate-500">Deep dive into data</p>
                            </div>
                        </Link>
                        <button
                            onClick={fetchOwnerStats}
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <PackageCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Refresh Stats</p>
                                <p className="text-xs text-slate-500">Sync latest metrics</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;

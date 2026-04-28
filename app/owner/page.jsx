'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
    Box, DollarSign, Mail, PackageCheck, ShoppingBag,
    Users, TrendingUp, TrendingDown, AlertCircle, ArrowRight
} from 'lucide-react';

const SimpleRevenueAreaChart = ({ data = [] }) => {
    const chartPoints = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }

        const revenues = data.map((entry) => Number(entry?.revenue) || 0);
        const maxRevenue = Math.max(...revenues, 1);
        const minY = 8;
        const maxY = 92;
        const xStep = data.length > 1 ? 100 / (data.length - 1) : 100;

        const points = data.map((entry, index) => {
            const x = data.length > 1 ? index * xStep : 50;
            const y = maxY - ((Number(entry?.revenue) || 0) / maxRevenue) * (maxY - minY);
            return { x, y, label: entry?.date || '', revenue: Number(entry?.revenue) || 0 };
        });

        const linePath = points
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
            .join(' ');
        const areaPath = `${linePath} L 100 ${maxY} L 0 ${maxY} Z`;

        return {
            points,
            linePath,
            areaPath,
            maxRevenue
        };
    }, [data]);

    if (!chartPoints) {
        return <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium">No data available for the selected period</div>;
    }

    return (
        <div className="h-full w-full flex flex-col">
            <div className="relative h-[240px] w-full">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                        <linearGradient id="simpleRevenueFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity="0.3" />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {[20, 40, 60, 80].map((y) => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#E2E8F0" strokeWidth="0.5" />
                    ))}

                    <path d={chartPoints.areaPath} fill="url(#simpleRevenueFill)" />
                    <path d={chartPoints.linePath} fill="none" stroke="#6366f1" strokeWidth="1.5" />

                    {chartPoints.points.map((point) => (
                        <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="1.1" fill="#6366f1">
                            <title>{`${point.label}: ₹${point.revenue.toLocaleString()}`}</title>
                        </circle>
                    ))}
                </svg>
            </div>

            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${chartPoints.points.length}, minmax(0, 1fr))` }}>
                {chartPoints.points.map((point) => (
                    <div key={`axis-${point.label}-${point.x}`} className="text-center">
                        <p className="text-[11px] font-semibold text-slate-500 truncate">{point.label}</p>
                        <p className="text-[11px] text-slate-400">₹{point.revenue.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OwnerDashboard = () => {
    const { getToken, user, router } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalContacts: 0,
        recentOrders: [],
        ordersByStatus: {},
        trends: { revenue: 0, orders: 0 },
        chartData: [],
        lowStockItems: []
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
        { key: 'placed', label: 'Placed', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
        { key: 'packed', label: 'Packed', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
        { key: 'shipped', label: 'Shipped', dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
        { key: 'delivered', label: 'Delivered', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        { key: 'rto', label: 'RTO', dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
        { key: 'failed', label: 'Failed', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' }
    ]), []);

    const metricCards = useMemo(() => ([
        {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            accent: 'text-emerald-600 bg-emerald-100',
            trend: stats.trends?.revenue || 0
        },
        {
            label: 'Total Orders',
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingBag,
            accent: 'text-blue-600 bg-blue-100',
            trend: stats.trends?.orders || 0
        },
        {
            label: 'Total Customers',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            accent: 'text-purple-600 bg-purple-100',
            trend: null
        },
        {
            label: 'Active Products',
            value: stats.totalProducts.toLocaleString(),
            icon: Box,
            accent: 'text-amber-600 bg-amber-100',
            trend: null
        }
    ]), [stats]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                    <p className="text-sm font-medium text-slate-500">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {metricCards.map((card) => {
                    const Icon = card.icon;
                    const isPositive = card.trend !== null && card.trend >= 0;

                    return (
                        <div key={card.label} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.accent}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                {card.trend !== null && (
                                    <div className={`flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(card.trend)}%
                                    </div>
                                )}
                            </div>
                            <div className="mt-5">
                                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Visual Data & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-6 sm:px-8 sm:pt-8 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Revenue Overview</h3>
                            <p className="text-sm text-slate-500 mt-1">Last 7 days performance</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span className="text-xs font-semibold text-slate-600">Revenue</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full px-4 sm:px-6 pb-6 pt-2">
                        <SimpleRevenueAreaChart data={stats.chartData} />
                    </div>
                </div>

                {/* Status Summary Widget */}
                <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm flex flex-col">
                    <div className="p-6 sm:p-8 border-b border-slate-100 flex-1">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Order Pipeline</h3>
                        <p className="text-sm text-slate-500 mt-1">Current logistics status</p>

                        <div className="mt-8 space-y-5">
                            {statusCards.map((card) => (
                                <Link href="/owner/orders" key={card.key} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${card.bg}`}>
                                            <PackageCheck className={`h-4 w-4 ${card.text}`} />
                                        </div>
                                        <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{card.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-slate-900">{stats.ordersByStatus?.[card.key] ?? 0}</span>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-b-3xl text-center">
                        <Link href="/owner/orders" className="inline-block w-full py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                            View all pipeline orders
                        </Link>
                    </div>
                </div>
            </div>

            {/* Action Center: Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders Action Block */}
                <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Orders</h3>
                            <p className="text-sm text-slate-500 mt-1">Latest customer purchases</p>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{stats.recentOrders?.length || 0} New</span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 sm:px-8 py-4">Order Details</th>
                                    <th className="px-6 sm:px-8 py-4">Status</th>
                                    <th className="px-6 sm:px-8 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.recentOrders?.length > 0 ? stats.recentOrders.slice(0, 5).map((order) => (
                                    <tr key={order._id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => router?.push(`/owner/orders`)}>
                                        <td className="px-6 sm:px-8 py-4">
                                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">#{order._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-sm text-slate-500 mt-0.5">{order.date ? new Date(order.date * 1000).toLocaleDateString() : 'Unknown Date'}</p>
                                        </td>
                                        <td className="px-6 sm:px-8 py-4">
                                            <div className="inline-flex items-center px-2.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-sm">
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${order.status === 'placed' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                                                <span className="capitalize">{order.status || 'Processing'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 sm:px-8 py-4 text-right font-bold text-slate-900">
                                            ₹{order.amount?.toLocaleString() || 0}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-10 text-center text-slate-500 text-sm">No recent orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alerts Action Block */}
                <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 border-b border-rose-100 bg-rose-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Low Stock Alerts</h3>
                                <p className="text-sm text-slate-500 mt-1">Variants needing immediate restock</p>
                            </div>
                        </div>
                        {stats.lowStockItems?.length > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">{stats.lowStockItems.length} SKUs</span>
                        )}
                    </div>
                    <div className="flex-1 p-6 sm:p-8">
                        {stats.lowStockItems?.length > 0 ? (
                            <div className="space-y-4">
                                {stats.lowStockItems.map((item) => (
                                    <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm transition-colors gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-bold text-slate-900 truncate">{item.variant?.productName || 'Unknown Product'}</h4>
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{item.sku}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">Size: {item.variant?.size} / Color: {item.variant?.color}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</p>
                                                <p className="text-lg font-black text-rose-600 mt-[1px]">{item.stock}</p>
                                            </div>
                                            <Link href={`/owner/inventory?sku=${item.sku}`} className="flex items-center justify-center shrink-0 h-10 w-10 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-full transition-colors">
                                                <ArrowRight className="h-5 w-5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 text-emerald-500">
                                    <PackageCheck className="h-8 w-8" />
                                </div>
                                <h4 className="font-bold text-slate-900 text-lg">Inventory looks healthy!</h4>
                                <p className="text-sm text-slate-500 mt-1 max-w-[280px]">All product variants are fully stocked and above their low threshold limits.</p>
                            </div>
                        )}
                    </div>
                    {stats.lowStockItems?.length > 0 && (
                        <div className="p-4 bg-rose-50/50 rounded-b-3xl border-t border-rose-100 text-center">
                            <Link href="/owner/inventory?lowStock=true" className="inline-block w-full py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100/50 rounded-xl transition-colors">
                                Review all low stock inventory
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;

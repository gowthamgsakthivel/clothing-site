'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { getDisplayOrderCode } from '@/lib/codeGenerators';
import {
    Box, DollarSign, Mail, PackageCheck, ShoppingBag,
    Users, TrendingUp, TrendingDown, AlertCircle, ArrowRight,
    Sparkles, RefreshCw, Calendar, ArrowUpRight, CheckCircle2,
    ShieldAlert, Filter, Download
} from 'lucide-react';

const SimpleRevenueAreaChart = ({ data = [] }) => {
    const chartPoints = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }

        const revenues = data.map((entry) => Number(entry?.revenue) || 0);
        const maxRevenue = Math.max(...revenues, 1);
        const minY = 12;
        const maxY = 88;
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
        return (
            <div className="h-full w-full min-h-[260px] flex flex-col items-center justify-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-slate-200/80 p-6 text-center">
                <Calendar className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">No revenue data available for this range</p>
                <p className="text-xs text-slate-500 mt-1">Transactions will plot here in real-time</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col justify-between">
            <div className="relative h-[230px] w-full">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <defs>
                        <linearGradient id="lightRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {[20, 40, 60, 80].map((y) => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3 3" />
                    ))}

                    <path d={chartPoints.areaPath} fill="url(#lightRevenueGradient)" />
                    <path d={chartPoints.linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {chartPoints.points.map((point) => (
                        <g key={`${point.label}-${point.x}`} className="group cursor-pointer">
                            <circle cx={point.x} cy={point.y} r="2.5" className="fill-indigo-600 stroke-white stroke-2 group-hover:r-3.5 transition-all shadow-sm" />
                            <title>{`${point.label}: ₹${point.revenue.toLocaleString()}`}</title>
                        </g>
                    ))}
                </svg>
            </div>

            <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4" style={{ gridTemplateColumns: `repeat(${chartPoints.points.length}, minmax(0, 1fr))` }}>
                {chartPoints.points.map((point) => (
                    <div key={`axis-${point.label}-${point.x}`} className="text-center group">
                        <p className="text-[10px] font-bold text-slate-500 truncate group-hover:text-indigo-600 transition-colors">{point.label}</p>
                        <p className="text-[11px] font-bold text-slate-800 mt-0.5 font-mono">₹{point.revenue.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OwnerDashboard = () => {
    const { getToken, user, router } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeframe, setTimeframe] = useState('7d');
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

    const fetchOwnerStats = useCallback(async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const token = await getToken();

            const response = await axios.get('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStats(response.data.data);
                if (isManualRefresh) toast.success('Dashboard synced');
            } else {
                toast.error(response.data.message || 'Failed to fetch stats');
            }
        } catch (error) {
            console.error('Error fetching owner stats:', error);
            toast.error('Failed to load owner dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (user) {
            fetchOwnerStats();
        }
    }, [user, fetchOwnerStats]);

    const statusCards = useMemo(() => ([
        { key: 'placed', label: 'Placed', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
        { key: 'packed', label: 'Packed', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
        { key: 'shipped', label: 'Shipped', dot: 'bg-indigo-500', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { key: 'delivered', label: 'Delivered', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { key: 'rto', label: 'RTO', dot: 'bg-orange-500', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
        { key: 'failed', label: 'Failed', dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
    ]), []);

    const metricCards = useMemo(() => ([
        {
            label: 'Gross Revenue',
            value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            accent: 'from-indigo-600 to-blue-600 text-white shadow-indigo-200',
            trend: stats.trends?.revenue ?? 12.4
        },
        {
            label: 'Total Orders',
            value: (stats.totalOrders || 0).toLocaleString(),
            icon: ShoppingBag,
            accent: 'from-blue-600 to-indigo-600 text-white shadow-blue-200',
            trend: stats.trends?.orders ?? 8.2
        },
        {
            label: 'Active Customers',
            value: (stats.totalUsers || 0).toLocaleString(),
            icon: Users,
            accent: 'from-purple-600 to-indigo-600 text-white shadow-purple-200',
            trend: 5.1
        },
        {
            label: 'Catalog Items',
            value: (stats.totalProducts || 0).toLocaleString(),
            icon: Box,
            accent: 'from-amber-500 to-orange-500 text-white shadow-amber-200',
            trend: null
        }
    ]), [stats]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                    <div className="relative flex items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                        <Sparkles className="w-5 h-5 text-indigo-600 absolute animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Synchronizing Store Performance...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 border border-indigo-700/50 p-6 sm:p-8 shadow-xl text-white">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-100 border border-white/20 flex items-center gap-1.5 backdrop-blur-md">
                                <Sparkles className="w-3.5 h-3.5" />
                                Executive Dashboard
                            </span>
                            <span className="text-xs text-indigo-200 font-medium">
                                Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Welcome back, Store Operations 👋
                        </h2>
                        <p className="text-sm text-indigo-100 mt-1 max-w-xl">
                            Here is your business snapshot. Revenue, logistics pipeline, and critical inventory alerts are live.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchOwnerStats(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 backdrop-blur-md"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-white ${refreshing ? 'animate-spin' : ''}`} />
                            <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
                        </button>

                        <div className="flex items-center bg-black/20 border border-white/20 rounded-xl p-1 backdrop-blur-md">
                            {['7d', '30d', '1y'].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === tf ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-200 hover:text-white'}`}
                                >
                                    {tf.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {metricCards.map((card) => {
                    const Icon = card.icon;
                    const isPositive = card.trend !== null && card.trend >= 0;

                    return (
                        <div
                            key={card.label}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} shadow-md transition-transform group-hover:scale-110 duration-300`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                {card.trend !== null && (
                                    <div className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(card.trend)}%
                                    </div>
                                )}
                            </div>
                            <div className="mt-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight font-mono">{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Visual Analytics & Logistics Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Revenue Chart Widget */}
                <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Revenue Analytics</h3>
                                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">Live Chart</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Transaction growth & cashflow curve</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                                <span className="text-xs font-bold text-slate-700">Revenue (INR)</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full my-2">
                        <SimpleRevenueAreaChart data={stats.chartData} />
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Order Value</p>
                            <p className="text-sm font-black text-slate-900 mt-1 font-mono">
                                ₹{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : '0'}
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Orders</p>
                            <p className="text-sm font-black text-emerald-600 mt-1 font-mono">
                                {stats.ordersByStatus?.delivered || 0}
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fulfilled Rate</p>
                            <p className="text-sm font-black text-indigo-600 mt-1 font-mono">
                                {stats.totalOrders > 0 ? Math.round(((stats.ordersByStatus?.delivered || 0) / stats.totalOrders) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Pipeline Widget */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Order Pipeline</h3>
                                <p className="text-xs text-slate-500 mt-1">Logistics & fulfillment status</p>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                                {stats.totalOrders} Total
                            </span>
                        </div>

                        <div className="space-y-3.5">
                            {statusCards.map((card) => {
                                const count = stats.ordersByStatus?.[card.key] ?? 0;
                                const percentage = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0;

                                return (
                                    <Link
                                        href="/owner/orders"
                                        key={card.key}
                                        className="block p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-2.5 h-2.5 rounded-full ${card.dot}`} />
                                                <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">{card.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-900 font-mono">{count}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${card.dot} transition-all duration-500`}
                                                style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <Link
                        href="/owner/orders"
                        className="mt-6 w-full py-3 text-center text-xs font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-2xl transition-all shadow-sm"
                    >
                        Manage All Orders →
                    </Link>
                </div>
            </div>

            {/* Split Action Section: Recent Orders & Inventory Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Recent Orders Table */}
                <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Orders</h3>
                            <p className="text-xs text-slate-500 mt-1">Latest customer checkouts</p>
                        </div>
                        <Link href="/owner/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            View All <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3.5">Order</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {stats.recentOrders?.length > 0 ? (
                                    stats.recentOrders.slice(0, 5).map((order) => (
                                        <tr
                                            key={order._id}
                                            onClick={() => router?.push(`/owner/orders`)}
                                            className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-mono">
                                                    #{getDisplayOrderCode(order)}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    {order.date ? new Date(order.date * 1000).toLocaleDateString() : 'Recent'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse" />
                                                    {order.status || 'placed'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                                                ₹{(order.amount || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-slate-500 text-xs">
                                            No recent orders recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between p-6 border-b border-rose-100 bg-rose-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-100 rounded-2xl border border-rose-200 text-rose-600">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Low Stock Alerts</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Variants below safety threshold</p>
                            </div>
                        </div>
                        {stats.lowStockItems?.length > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-xs font-black px-3 py-1 rounded-full border border-rose-200">
                                {stats.lowStockItems.length} SKUs
                            </span>
                        )}
                    </div>

                    <div className="flex-1 p-6">
                        {stats.lowStockItems?.length > 0 ? (
                            <div className="space-y-3">
                                {stats.lowStockItems.slice(0, 4).map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all gap-4"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-xs text-slate-900 truncate">
                                                {item.variant?.productName || 'Product Variant'}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                                    {item.sku}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    {item.variant?.size} / {item.variant?.color}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Stock</span>
                                                <span className="text-sm font-black text-rose-600 font-mono">{item.stock} left</span>
                                            </div>
                                            <Link
                                                href={`/owner/inventory?sku=${item.sku}`}
                                                className="p-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 transition-all shadow-sm"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3 text-emerald-600">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <h4 className="font-extrabold text-slate-900 text-base">Inventory is fully healthy!</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                                    All variant SKUs are above safety stock limits.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                        <Link
                            href="/owner/inventory"
                            className="inline-block w-full py-2.5 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-sm"
                        >
                            Open Stock Manager →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;

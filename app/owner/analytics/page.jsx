'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import {
  Clock, DollarSign, RotateCcw, Search, ShoppingBag, Truck,
  Sparkles, RefreshCw, ArrowUpRight, TrendingUp, TrendingDown,
  BarChart2, ShieldAlert, Award, ChevronRight
} from 'lucide-react';
import Loading from '@/components/Loading';

const MetricCard = ({ label, value, trend, icon: Icon, accent, isPositive = true }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} shadow-md transition-transform group-hover:scale-110 duration-300`}>
        <Icon className="h-5.5 w-5.5 text-white" />
      </div>
      {trend && (
        <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </span>
      )}
    </div>
    <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight font-mono">{value}</p>
  </div>
);

const TrendChart = ({ title, subtitle, data, color = '#4f46e5', variant = 'line' }) => {
  const values = (data || []).map((point) => point.value);
  const dates = (data || []).map((point) => point.date);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const width = 520;
  const height = 180;
  const padding = 14;

  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          {dates[0] || 'Start'} → {dates[dates.length - 1] || 'End'}
        </span>
      </div>

      {values.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-slate-200/80">
          No metrics available
        </div>
      ) : (
        <div className="relative w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full overflow-visible">
            <defs>
              <linearGradient id={`lightgrad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {variant === 'bar' ? (
              values.map((value, index) => {
                const barWidth = (width - padding * 2) / Math.max(values.length, 1) - 5;
                const x = padding + index * ((width - padding * 2) / Math.max(values.length, 1)) + 2.5;
                const barHeight = ((value - min) / range) * (height - padding * 2);
                const y = height - padding - barHeight;
                return (
                  <rect
                    key={`${x}-${value}`}
                    x={x}
                    y={y}
                    width={Math.max(barWidth, 3)}
                    height={Math.max(barHeight, 3)}
                    rx="3"
                    fill={color}
                    className="hover:opacity-100 opacity-80 transition-opacity"
                  >
                    <title>{`${dates[index]}: ${value}`}</title>
                  </rect>
                );
              })
            ) : (
              <>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                <polygon
                  fill={`url(#lightgrad-${title.replace(/\s+/g, '')})`}
                  points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`}
                />
              </>
            )}
          </svg>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500 font-bold">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
          <p className="uppercase text-slate-400">Min</p>
          <p className="text-xs font-mono font-black text-slate-700 mt-0.5">{min}</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
          <p className="uppercase text-slate-400">Peak</p>
          <p className="text-xs font-mono font-black text-indigo-600 mt-0.5">{max}</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
          <p className="uppercase text-slate-400">Latest</p>
          <p className="text-xs font-mono font-black text-emerald-600 mt-0.5">{values[values.length - 1] ?? 0}</p>
        </div>
      </div>
    </div>
  );
};

const AnalyticsV2Page = () => {
  const { getToken, currency, user } = useAppContext();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async (isManual = false) => {
    try {
      if (!user?.id) {
        setError('Authentication not ready. Please try again.');
        return;
      }
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError('');

      const token = await getToken();
      const response = await axios.get('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load analytics');
      }

      setSummary(response.data.data);
      if (isManual) toast.success('Analytics updated');
    } catch (error) {
      const message = error?.message || 'Failed to load analytics';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchSummary();
    }
  }, [fetchSummary, user?.id]);

  const revenueTrend = useMemo(() => summary?.revenueTrend || [], [summary]);
  const orderTrend = useMemo(() => summary?.orderTrend || [], [summary]);
  const last7Revenue = useMemo(() => revenueTrend.slice(-7), [revenueTrend]);

  const chartData = useMemo(() => {
    const sliceCount = range === '90d' ? 90 : 30;
    return {
      revenue: revenueTrend.slice(-sliceCount),
      orders: orderTrend.slice(-sliceCount)
    };
  }, [range, revenueTrend, orderTrend]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Loading size="lg" text="Aggregating Business Intelligence..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center max-w-lg mx-auto shadow-xl">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-extrabold text-slate-900">Unable to load analytics</h3>
        <p className="mt-2 text-xs text-slate-500">{error || 'No analytics record available.'}</p>
        <button
          type="button"
          onClick={() => fetchSummary(true)}
          className="mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-200"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Business Intelligence</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              V2 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Real-time revenue, conversion rates, and volume metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
            {['30d', '90d'].map((val) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${range === val ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {val.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          trend="+12%"
          icon={DollarSign}
          accent="from-indigo-600 to-blue-600"
          isPositive={true}
        />
        <MetricCard
          label="Total Orders"
          value={summary.totalOrders}
          trend="+5%"
          icon={ShoppingBag}
          accent="from-blue-600 to-indigo-600"
          isPositive={true}
        />
        <MetricCard
          label="Delivered"
          value={summary.deliveredOrders}
          trend="+8%"
          icon={Truck}
          accent="from-emerald-600 to-green-600"
          isPositive={true}
        />
        <MetricCard
          label="RTO Count"
          value={summary.rtoCount}
          trend="-1.5%"
          icon={RotateCcw}
          accent="from-amber-500 to-orange-500"
          isPositive={true}
        />
        <MetricCard
          label="Pending Sync"
          value={summary.pendingShipments}
          trend="+2%"
          icon={Clock}
          accent="from-purple-600 to-indigo-600"
          isPositive={false}
        />
      </div>

      {/* 4-Grid Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrendChart
          title="Revenue Growth Curve"
          subtitle={`Total revenue over the last ${range}`}
          data={chartData.revenue}
          color="#4f46e5"
          variant="line"
        />
        <TrendChart
          title="Order Volume Histogram"
          subtitle={`Volume of order transactions over ${range}`}
          data={chartData.orders}
          color="#2563eb"
          variant="bar"
        />
        <TrendChart
          title="Daily Sales Breakdown"
          subtitle="Daily sales velocity for recent 7 days"
          data={last7Revenue}
          color="#10b981"
          variant="bar"
        />
        <TrendChart
          title="7-Day Performance Velocity"
          subtitle="Revenue trend over last 7 consecutive days"
          data={last7Revenue}
          color="#0891b2"
          variant="line"
        />
      </div>

      {/* Bottom Split Section: Top Products & Inventory Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products Leaderboard */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Top Performing Products</h3>
                  <p className="text-xs text-slate-500">Ranked by overall gross sales</p>
                </div>
              </div>
              <Link href="/owner/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Products <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.topProducts?.map((item, index) => (
                    <tr key={item.variantId || index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-600">
                        ₹{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Stock Depletion Alerts</h3>
                  <p className="text-xs text-slate-500">SKUs reaching minimum inventory levels</p>
                </div>
              </div>
              <Link href="/owner/inventory" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Inventory <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.lowStockSkus?.map((item) => {
                    const available = Math.max(0, item.totalStock - item.reservedStock);
                    return (
                      <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{item.sku}</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-rose-600">{available} units</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            Low Stock
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsV2Page;

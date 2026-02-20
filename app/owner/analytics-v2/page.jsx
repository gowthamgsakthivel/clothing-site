'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import { Clock, DollarSign, RotateCcw, Search, ShoppingBag, Truck } from 'lucide-react';

const MetricCard = ({ label, value, trend, icon: Icon, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>
    </div>
    <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const TrendChart = ({ title, data, color, variant = 'line' }) => {
  const values = data.map((point) => point.value);
  const dates = data.map((point) => point.date);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const width = 520;
  const height = 180;
  const padding = 12;

  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">{dates[0] || '-'} to {dates[dates.length - 1] || '-'}</span>
      </div>
      {values.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">No data</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {variant === 'bar' ? (
            values.map((value, index) => {
              const barWidth = (width - padding * 2) / Math.max(values.length, 1) - 6;
              const x = padding + index * ((width - padding * 2) / Math.max(values.length, 1)) + 3;
              const barHeight = ((value - min) / range) * (height - padding * 2);
              const y = height - padding - barHeight;
              return (
                <rect
                  key={`${x}-${value}`}
                  x={x}
                  y={y}
                  width={Math.max(barWidth, 2)}
                  height={Math.max(barHeight, 2)}
                  rx="4"
                  fill={color}
                  opacity="0.9"
                />
              );
            })
          ) : (
            <>
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
              />
              <polygon
                fill="url(#trendFill)"
                points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`}
              />
            </>
          )}
        </svg>
      )}
      <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-slate-500">
        <div>
          <p className="uppercase">Low</p>
          <p className="text-sm font-semibold text-slate-700">{min}</p>
        </div>
        <div>
          <p className="uppercase">High</p>
          <p className="text-sm font-semibold text-slate-700">{max}</p>
        </div>
        <div>
          <p className="uppercase">Latest</p>
          <p className="text-sm font-semibold text-slate-700">{values[values.length - 1] ?? 0}</p>
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

  const fetchSummary = useCallback(async () => {
    try {
      if (!user?.id) {
        setError('Authentication not ready. Please try again.');
        return;
      }
      setLoading(true);
      setError('');
      const token = await getToken();
      const response = await axios.get('/api/admin/analytics-v2', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load analytics');
      }

      setSummary(response.data.data);
    } catch (error) {
      const message = error?.message || 'Failed to load analytics';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
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
  const todaySales = useMemo(() => {
    const lastPoint = last7Revenue[last7Revenue.length - 1];
    return lastPoint?.value ?? 0;
  }, [last7Revenue]);

  const chartData = useMemo(() => {
    const sliceCount = range === '90d' ? 90 : 30;
    return {
      revenue: revenueTrend.slice(-sliceCount),
      orders: orderTrend.slice(-sliceCount)
    };
  }, [range, revenueTrend, orderTrend]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm">
        <p className="font-semibold text-slate-900">Unable to load analytics</p>
        <p className="mt-2 text-slate-500">{error || 'No data available yet.'}</p>
        <button
          type="button"
          onClick={fetchSummary}
          className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics Overview</h2>
          <p className="text-sm text-slate-500">Track your store performance in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search data..."
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            onClick={fetchSummary}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard
          label="Total Revenue"
          value={`${currency}${summary.totalRevenue.toFixed(2)}`}
          trend="+12%"
          icon={DollarSign}
          accent="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Total Orders"
          value={summary.totalOrders}
          trend="+5%"
          icon={ShoppingBag}
          accent="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Delivered"
          value={summary.deliveredOrders}
          trend="+8%"
          icon={Truck}
          accent="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="RTO Rate"
          value={`${summary.rtoCount}`}
          trend="-1.5%"
          icon={RotateCcw}
          accent="bg-orange-50 text-orange-600"
        />
        <MetricCard
          label="Pending"
          value={summary.pendingShipments}
          trend="+2%"
          icon={Clock}
          accent="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Revenue Trend</p>
              <p className="text-xs text-slate-500">Income over the last period</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {['30d', '90d'].map((value) => (
                <button
                  key={value}
                  onClick={() => setRange(value)}
                  className={`px-2.5 py-1 rounded-full border ${range === value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <TrendChart title="Revenue trend" data={chartData.revenue} color="#2563eb" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Order Volume</p>
              <p className="text-xs text-slate-500">Total orders over the last period</p>
            </div>
          </div>
          <TrendChart title="Orders trend" data={chartData.orders} color="#2563eb" variant="bar" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Daily Sales</p>
              <p className="text-xs text-slate-500">Latest 7 day breakdown</p>
            </div>
          </div>
          <TrendChart title="Daily sales" data={last7Revenue} color="#10b981" variant="bar" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Last 7 Days Trend</p>
              <p className="text-xs text-slate-500">Sales trend for the last week</p>
            </div>
          </div>
          <TrendChart title="Last 7 days" data={last7Revenue} color="#10b981" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Top 5 Products</h3>
            <Link href="/owner/products" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <tr>
                  <th className="py-2">Rank</th>
                  <th className="py-2">Product</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.topProducts?.map((item, index) => (
                  <tr key={item.variantId}>
                    <td className="py-3 text-slate-500">#{index + 1}</td>
                    <td className="py-3 text-slate-700">{item.productName}</td>
                    <td className="py-3 text-slate-500">{item.sku}</td>
                    <td className="py-3 text-right text-slate-900 font-semibold">{currency}{item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Low Stock Alert</h3>
            <Link href="/owner/inventory-v2" className="text-xs text-blue-600 hover:underline">
              View Inventory
            </Link>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <tr>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Stock</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.lowStockSkus?.map((item) => {
                  const available = Math.max(0, item.totalStock - item.reservedStock);
                  return (
                    <tr key={item._id}>
                      <td className="py-3 text-slate-700">{item.sku}</td>
                      <td className="py-3 text-right text-slate-900 font-semibold">{available}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">Low</span>
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
  );
};

export default AnalyticsV2Page;

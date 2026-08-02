'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { getDisplayOrderCode } from '@/lib/codeGenerators';
import {
  Pagination
} from '@/components/ui';
import {
  ShoppingBag, Search, RefreshCw, ExternalLink,
  X, CheckCircle2, FileText, ShieldAlert, Box,
  Truck, PackageCheck, Ban, Printer, AlertTriangle
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'placed', label: 'Placed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'grandTotal:desc', label: 'Highest Amount' },
  { value: 'grandTotal:asc', label: 'Lowest Amount' }
];

const SUMMARY_FILTERS = [
  { key: 'all', label: 'All Orders' },
  { key: 'placed', label: 'Placed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rto', label: 'RTO' },
  { key: 'failed', label: 'Failed Sync' }
];

const OrdersV2Page = () => {
  const { getToken } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shipmentFilter, setShipmentFilter] = useState('all');
  const [sortValue, setSortValue] = useState('createdAt:desc');
  const [page, setPage] = useState(1);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [detailsShipment, setDetailsShipment] = useState(null);

  const [actionState, setActionState] = useState({ orderId: null, action: null });
  const [retryingId, setRetryingId] = useState(null);

  // Pack Modal State
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [packOrderId, setPackOrderId] = useState(null);
  const [packForm, setPackForm] = useState({
    lengthCm: '25',
    breadthCm: '18',
    heightCm: '10',
    weightKg: '0.8'
  });

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();

      const [sortField, sortOrder] = sortValue.split(':');
      const response = await axios.get('/api/admin/orders', {
        params: {
          page,
          limit: 10,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search.trim() || undefined,
          sort: sortField,
          order: sortOrder
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch orders');
      }

      setOrders(response.data.data.orders || []);
      setPagination(response.data.data.pagination || { currentPage: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search, sortValue, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      const token = await getToken();
      const response = await axios.get(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setDetailsOrder(response.data.data.order);
        setDetailsShipment(response.data.data.shipment);
        setDetailsOpen(true);
      } else {
        toast.error('Failed to load order details');
      }
    } catch (err) {
      toast.error('Failed to load order details');
    }
  }, [getToken]);

  const retrySync = useCallback(async (shipmentId) => {
    if (!shipmentId) return;

    try {
      setRetryingId(shipmentId);
      const token = await getToken();
      const response = await axios.post(`/api/admin/shipments/${shipmentId}/retry`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Retry failed');
      }

      toast.success('Shipment retried successfully');
      await fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  }, [fetchOrders, getToken]);

  const runLifecycleAction = useCallback(async (orderId, action, payload = {}) => {
    if (!orderId || !action) return;

    // Optimistic UI state update
    setOrders((prev) => prev.map((o) => {
      if (o._id === orderId) {
        let newStatus = o.status;
        if (action === 'pack') newStatus = 'packed';
        if (action === 'ship') newStatus = 'shipped';
        if (action === 'deliver') newStatus = 'delivered';
        if (action === 'cancel') newStatus = 'cancelled';
        return { ...o, status: newStatus };
      }
      return o;
    }));

    try {
      setActionState({ orderId, action });
      const token = await getToken();
      const response = await axios.patch(
        `/api/admin/orders/${orderId}/${action}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        toast.success(`Order ${action}ed successfully`);
      } else {
        toast.error(response.data?.message || `Failed to ${action} order`);
      }
      await fetchOrders();
      if (detailsOrder?._id === orderId) {
        await fetchOrderDetails(orderId);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || `Failed to ${action} order`;
      if (err?.response?.status === 409) {
        toast.success(`Order status updated (${action})`);
        await fetchOrders();
      } else {
        toast.error(errorMsg);
        await fetchOrders(); // Rollback to server truth
      }
    } finally {
      setActionState({ orderId: null, action: null });
    }
  }, [detailsOrder?._id, fetchOrderDetails, fetchOrders, getToken]);

  const openPackModal = useCallback((orderId) => {
    if (!orderId) return;
    setPackOrderId(orderId);
    setPackModalOpen(true);
  }, []);

  const closePackModal = useCallback(() => {
    setPackModalOpen(false);
    setPackOrderId(null);
  }, []);

  const submitPack = useCallback(async () => {
    const parsed = {
      lengthCm: Number(packForm.lengthCm),
      breadthCm: Number(packForm.breadthCm),
      heightCm: Number(packForm.heightCm),
      weightKg: Number(packForm.weightKg)
    };

    const isValid = Object.values(parsed).every((value) => Number.isFinite(value) && value > 0);
    if (!isValid) {
      toast.error('Please enter valid package dimensions and weight');
      return;
    }

    const currentOrderId = packOrderId;
    closePackModal();
    const loadingToastId = toast.loading('Packing order and generating shipping label...');

    try {
      await runLifecycleAction(currentOrderId, 'pack', { packageDetails: parsed });
    } finally {
      toast.dismiss(loadingToastId);
    }
  }, [closePackModal, packForm, packOrderId, runLifecycleAction]);

  const openCancelModal = (order) => {
    setCancelOrderTarget(order);
    setCancelModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!cancelOrderTarget) return;
    const targetId = cancelOrderTarget._id;
    setCancelModalOpen(false);
    setCancelOrderTarget(null);
    await runLifecycleAction(targetId, 'cancel');
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'packed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const rows = useMemo(() => {
    if (!orders.length) return null;

    const filteredOrders = orders.filter((order) => {
      if (shipmentFilter === 'rto') {
        return order.shipment?.externalStatus === 'rto';
      }
      if (shipmentFilter === 'failed') {
        return order.shipment?.externalStatus === 'failed';
      }
      return true;
    });

    if (!filteredOrders.length) return null;

    return filteredOrders.map((order) => {
      const shipment = order.shipment;
      const trackingLink = shipment?.trackingUrl || null;
      const canRetry = shipment?.externalStatus === 'failed';

      const isPlaced = order.status === 'placed';
      const isPacked = order.status === 'packed';
      const isShipped = order.status === 'shipped';
      const isDelivered = order.status === 'delivered';
      const isCancelled = order.status === 'cancelled';
      const canCancel = !isDelivered && !isCancelled;

      const isBusy = actionState.orderId === order._id;

      return (
        <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td className="px-6 py-4 font-mono font-bold text-indigo-600">
            #{getDisplayOrderCode(order)}
          </td>
          <td className="px-6 py-4">
            <p className="font-bold text-slate-900">{order.customerName || 'Guest'}</p>
            <p className="text-[11px] text-slate-500 max-w-[140px] truncate" title={order.customerEmail || order.userId}>
              {order.customerEmail || order.userId}
            </p>
          </td>
          <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {order.paymentStatus || 'pending'}
            </span>
          </td>
          <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize border ${getStatusBadgeStyle(order.status)}`}>
              {order.status}
            </span>
          </td>
          <td className="px-6 py-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
              {shipment?.externalStatus || 'not_created'}
            </span>
            {trackingLink && shipment?.trackingId && (
              <a href={trackingLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold">
                Track <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </td>
          <td className="px-6 py-4 font-mono font-black text-slate-900">
            ₹{order.grandTotal?.toFixed(2)}
          </td>
          <td className="px-6 py-4 text-xs text-slate-500 font-mono">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '--'}
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
              {/* Details Drawer Trigger */}
              <button
                type="button"
                onClick={() => fetchOrderDetails(order._id)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
              >
                Details
              </button>

              {/* Printable Invoice Link */}
              <Link
                href={`/owner/orders/${order._id}/invoice`}
                target="_blank"
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
              </Link>

              {/* Pack Action */}
              {isPlaced && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openPackModal(order._id)}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{isBusy && actionState.action === 'pack' ? 'Packing...' : 'Pack'}</span>
                </button>
              )}

              {/* Ship Action */}
              {isPacked && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => runLifecycleAction(order._id, 'ship')}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{isBusy && actionState.action === 'ship' ? 'Shipping...' : 'Ship'}</span>
                </button>
              )}

              {/* Deliver Action */}
              {isShipped && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => runLifecycleAction(order._id, 'deliver')}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>{isBusy && actionState.action === 'deliver' ? 'Delivering...' : 'Deliver'}</span>
                </button>
              )}

              {/* Cancel Action */}
              {canCancel && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => openCancelModal(order)}
                  className="px-2.5 py-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-50"
                  title="Cancel Order"
                >
                  {isBusy && actionState.action === 'cancel' ? 'Cancelling...' : 'Cancel'}
                </button>
              )}

              {/* Retry Sync */}
              {canRetry && (
                <button
                  type="button"
                  disabled={retryingId === shipment?._id}
                  onClick={() => retrySync(shipment?._id)}
                  className="px-2.5 py-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all"
                >
                  {retryingId === shipment?._id ? 'Syncing...' : 'Retry'}
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  }, [actionState.action, actionState.orderId, fetchOrderDetails, openPackModal, orders, retrySync, retryingId, shipmentFilter, runLifecycleAction]);

  const summaryCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      placed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      rto: 0,
      failed: 0
    };

    orders.forEach((order) => {
      const status = order.status;
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
      if (order.shipment?.externalStatus === 'rto') {
        counts.rto += 1;
      }
      if (order.shipment?.externalStatus === 'failed') {
        counts.failed += 1;
      }
    });

    return counts;
  }, [orders]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Orders & Fulfillment</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Live Logistics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage sales orders, pack shipments, transition states, and print invoices.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync Orders'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search by Order ID, Customer Name, Email, or Phone..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={sortValue}
              onChange={(event) => {
                setPage(1);
                setSortValue(event.target.value);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearch('');
                setSortValue('createdAt:desc');
                setPage(1);
              }}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          {SUMMARY_FILTERS.map((filter) => {
            const isActive = filter.key === 'all'
              ? statusFilter === 'all' && shipmentFilter === 'all'
              : ['rto', 'failed'].includes(filter.key)
                ? shipmentFilter === filter.key
                : statusFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
                  }`}
                onClick={() => {
                  if (filter.key === 'all') {
                    setStatusFilter('all');
                    setShipmentFilter('all');
                    setPage(1);
                    return;
                  }
                  if (filter.key === 'rto' || filter.key === 'failed') {
                    setShipmentFilter(filter.key);
                    setStatusFilter('all');
                    setPage(1);
                    return;
                  }
                  setShipmentFilter('all');
                  setStatusFilter(filter.key);
                  setPage(1);
                }}
              >
                <span>{filter.label}</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {summaryCounts[filter.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {error ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900">Error loading orders</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 && !loading ? (
          <div className="p-16 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-slate-900">No orders matching criteria</h4>
            <p className="text-xs text-slate-500 mt-1">Try resetting your search query or filter tags.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Fulfillment</th>
                  <th className="px-6 py-4">Shipment</th>
                  <th className="px-6 py-4">Grand Total</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Loading orders...
                    </td>
                  </tr>
                ) : rows}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Order Detail Drawer Modal */}
      {detailsOpen && detailsOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Order #{getDisplayOrderCode(detailsOrder)}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">ID: {detailsOrder._id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{detailsOrder.customerName || 'Guest'}</p>
                  <p className="text-xs text-slate-500">{detailsOrder.customerEmail || detailsOrder.userId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payment</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-extrabold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 capitalize">
                    {detailsOrder.paymentMethod || 'Razorpay'} ({detailsOrder.paymentStatus || 'Paid'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fulfillment Status</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-extrabold rounded-full border capitalize ${getStatusBadgeStyle(detailsOrder.status)}`}>
                    {detailsOrder.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Grand Total</span>
                  <p className="text-base font-black text-emerald-600 font-mono mt-0.5">
                    ₹{detailsOrder.grandTotal?.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Line Items ({detailsOrder.items?.length || 0})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {detailsOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{item.designName || item.productName || 'Catalog Product'}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          SKU: {item.sku} {item.size ? `| Size: ${item.size}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900">₹{item.totalPrice?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipment Info */}
              {detailsShipment && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Shiprocket Logistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">AWB:</span>
                      <span className="font-mono font-bold text-slate-800 ml-2">{detailsShipment.awb || '--'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Courier:</span>
                      <span className="font-bold text-slate-800 ml-2">{detailsShipment.courier || '--'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-indigo-600 ml-2 capitalize">{detailsShipment.externalStatus || '--'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tracking ID:</span>
                      <span className="font-mono font-bold text-slate-800 ml-2">{detailsShipment.trackingId || '--'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <Link
                href={`/owner/orders/${detailsOrder._id}/invoice`}
                target="_blank"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Print Invoice</span>
              </Link>

              <div className="flex items-center gap-2">
                {detailsOrder.status === 'placed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsOpen(false);
                      openPackModal(detailsOrder._id);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm"
                  >
                    Pack Order
                  </button>
                )}

                {detailsOrder.status === 'packed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsOpen(false);
                      runLifecycleAction(detailsOrder._id, 'ship');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm"
                  >
                    Mark Shipped
                  </button>
                )}

                {detailsOrder.status === 'shipped' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsOpen(false);
                      runLifecycleAction(detailsOrder._id, 'deliver');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                  >
                    Mark Delivered
                  </button>
                )}

                {detailsOrder.status !== 'delivered' && detailsOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsOpen(false);
                      openCancelModal(detailsOrder);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Package Dimension Modal */}
      {packModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Enter Packed Box Specs</h3>
                <p className="text-xs text-slate-500">Data will be pushed to Shiprocket API for shipping label generation.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Length (cm)</label>
                <input
                  type="number"
                  value={packForm.lengthCm}
                  onChange={(e) => setPackForm((prev) => ({ ...prev, lengthCm: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Breadth (cm)</label>
                <input
                  type="number"
                  value={packForm.breadthCm}
                  onChange={(e) => setPackForm((prev) => ({ ...prev, breadthCm: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={packForm.heightCm}
                  onChange={(e) => setPackForm((prev) => ({ ...prev, heightCm: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-600 font-bold block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={packForm.weightKg}
                  onChange={(e) => setPackForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closePackModal}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPack}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm & Pack Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && cancelOrderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Cancel Order #{getDisplayOrderCode(cancelOrderTarget)}?</h3>
                <p className="text-xs text-slate-500">This action will release reserved stock back into inventory.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to cancel order for <strong>{cancelOrderTarget.customerName || cancelOrderTarget.userId}</strong> worth <strong>₹{cancelOrderTarget.grandTotal?.toFixed(2)}</strong>?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelOrderTarget(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={confirmCancelOrder}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersV2Page;

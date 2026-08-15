'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import Image from 'next/image';
import { getDisplayOrderCode } from '@/lib/codeGenerators';
import {
  Pagination
} from '@/components/ui';
import {
  ShoppingBag, Search, RefreshCw, ExternalLink,
  X, CheckCircle2, FileText, ShieldAlert, Box,
  Truck, PackageCheck, Ban, Printer, AlertTriangle,
  Copy, Check, CreditCard
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'placed', label: '⏳ Waiting to Pack (Placed)' },
  { value: 'packed', label: '📦 Ready to Ship (Packed)' },
  { value: 'shipped', label: '🚚 In Transit (Shipped)' },
  { value: 'delivered', label: '✅ Customer Received (Delivered)' },
  { value: 'cancelled', label: '❌ Cancelled' }
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'grandTotal:desc', label: 'Highest Amount' },
  { value: 'grandTotal:asc', label: 'Lowest Amount' }
];

const SUMMARY_FILTERS = [
  { key: 'all', label: 'All Orders' },
  { key: 'placed', label: '⏳ Waiting to Pack' },
  { key: 'packed', label: '📦 Ready to Ship' },
  { key: 'shipped', label: '🚚 In Transit' },
  { key: 'delivered', label: '✅ Customer Received' },
  { key: 'cancelled', label: '❌ Cancelled' },
  { key: 'rto', label: '↩️ RTO / Returns' },
  { key: 'failed', label: '⚠️ Sync Issues' }
];

const CANCELLATION_REASONS = [
  'Item out of stock / Quality check issue',
  'Customer requested cancellation',
  'Delivery address incomplete / invalid',
  'Delivery pincode unserviceable by courier',
  'Duplicate / fraudulent order',
  'Other reason'
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
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [cancelNotes, setCancelNotes] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Lock body scroll when drawer or modals are open to prevent horizontal/vertical shifting
  useEffect(() => {
    if (detailsOpen || packModalOpen || cancelModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [detailsOpen, packModalOpen, cancelModalOpen]);

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
    setCancelReason(CANCELLATION_REASONS[0]);
    setCancelNotes('');
    setCancelModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!cancelOrderTarget) return;
    const targetId = cancelOrderTarget._id;
    const reason = cancelReason;
    const notes = cancelNotes.trim() || undefined;
    setCancelModalOpen(false);
    setCancelOrderTarget(null);
    await runLifecycleAction(targetId, 'cancel', { reason, notes });
  };

  const getStatusBadge = (status, order = null) => {
    switch (status) {
      case 'placed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            ⏳ Waiting to Pack
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
            📦 Ready to Ship
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
            🚚 In Transit
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✅ Received by Customer
          </span>
        );
      case 'cancelled': {
        const isCredited = order?.refundStatus === 'completed' || order?.paymentStatus === 'refunded';
        const isInitiated = order?.refundStatus === 'initiated' || (order?.paymentStatus === 'paid' && order?.paymentMethod !== 'COD');
        const isCod = order?.paymentMethod === 'COD' && order?.paymentStatus !== 'paid';

        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">
              ❌ Cancelled
            </span>
            {isCredited ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <span>💰 Refund Credited</span>
                <span>✓</span>
              </span>
            ) : isInitiated ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                <span>Refund Pending</span>
              </span>
            ) : isCod ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                COD • No Refund Needed
              </span>
            ) : null}
          </div>
        );
      }
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            {status}
          </span>
        );
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'packed':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const markRefundAsCredited = async (orderId) => {
    if (!orderId) return;
    const loadingToastId = toast.loading('Marking refund as credited...');
    try {
      const token = await getToken();
      const response = await axios.patch(
        `/api/admin/orders/${orderId}/refund`,
        { refundStatus: 'completed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.success) {
        toast.success('Refund marked as Credited / Completed');
        await fetchOrders();
        if (detailsOrder?._id === orderId) {
          await fetchOrderDetails(orderId);
        }
      } else {
        toast.error(response.data?.message || 'Failed to update refund status');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update refund status');
    } finally {
      toast.dismiss(loadingToastId);
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
        <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
          {/* Order Code, Date & Item Thumbnail */}
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="relative w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                  {order.items[0]?.productImage ? (
                    <Image
                      src={order.items[0].productImage}
                      alt={order.items[0].productName || 'product'}
                      width={36}
                      height={36}
                      sizes="36px"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Box className="w-4 h-4 text-slate-300" />
                  )}
                  {order.items.length > 1 && (
                    <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[8px] font-mono font-bold px-1 rounded-tl">
                      +{order.items.length - 1}
                    </span>
                  )}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-mono font-bold text-indigo-600 text-xs">#{getDisplayOrderCode(order)}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : '--'}
                </p>
              </div>
            </div>
          </td>

          {/* Customer */}
          <td className="px-4 py-3.5">
            <p className="font-bold text-slate-900 text-xs truncate max-w-[130px]">{order.customerName || 'Guest'}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px]" title={order.customerEmail || order.userId}>
              {order.customerEmail || order.userId}
            </p>
          </td>

          {/* Status & Payment Combined */}
          <td className="px-4 py-3.5">
            <div className="flex flex-col gap-1 items-start">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold capitalize ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {order.paymentStatus === 'paid' ? '● Paid' : 'Pending'}
              </span>
              {getStatusBadge(order.status, order)}
            </div>
          </td>

          {/* Shipment / Courier */}
          <td className="px-4 py-3.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
              {shipment?.externalStatus || 'Not Created'}
            </span>
            {trackingLink && shipment?.trackingId && (
              <a href={trackingLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold">
                Track AWB <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </td>

          {/* Amount */}
          <td className="px-4 py-3.5 font-mono font-black text-slate-900 text-xs whitespace-nowrap">
            ₹{order.grandTotal?.toFixed(2)}
          </td>

          {/* Actions - Sticky Right */}
          <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[-6px_0_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-end gap-1.5">
              {/* Details Drawer Trigger */}
              <button
                type="button"
                onClick={() => fetchOrderDetails(order._id)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                Details
              </button>

              {/* Printable Invoice Link */}
              <Link
                href={`/owner/orders/${order._id}/invoice`}
                target="_blank"
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-all shadow-2xs"
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
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1 cursor-pointer"
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
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1 cursor-pointer"
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
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1 cursor-pointer"
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
                  className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  title="Cancel Order"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Retry Sync */}
              {canRetry && (
                <button
                  type="button"
                  disabled={retryingId === shipment?._id}
                  onClick={() => retrySync(shipment?._id)}
                  className="px-2 py-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold"
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync Orders'}</span>
          </button>
        </div>
      </div>

      {/* Visual Tracking KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        {/* Waiting to Pack */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('placed');
            setShipmentFilter('all');
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer min-w-0 ${
            statusFilter === 'placed'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-amber-200 hover:bg-amber-50/30 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">⏳</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
              {summaryCounts.placed}
            </span>
          </div>
          <p className="text-xs font-black text-slate-900 mt-1.5 truncate">Waiting to Pack</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Paid orders awaiting box</p>
        </button>

        {/* Ready to Ship */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('packed');
            setShipmentFilter('all');
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer min-w-0 ${
            statusFilter === 'packed'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:bg-indigo-50/30 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">📦</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
              {summaryCounts.packed}
            </span>
          </div>
          <p className="text-xs font-black text-slate-900 mt-1.5 truncate">Ready for Courier</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Boxed & awaiting pickup</p>
        </button>

        {/* In Transit */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('shipped');
            setShipmentFilter('all');
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer min-w-0 ${
            statusFilter === 'shipped'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:bg-blue-50/30 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">🚚</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
              {summaryCounts.shipped}
            </span>
          </div>
          <p className="text-xs font-black text-slate-900 mt-1.5 truncate">In Transit</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">On road with courier</p>
        </button>

        {/* Customer Received */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('delivered');
            setShipmentFilter('all');
            setPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer min-w-0 ${
            statusFilter === 'delivered'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/30 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">✅</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
              {summaryCounts.delivered}
            </span>
          </div>
          <p className="text-xs font-black text-slate-900 mt-1.5 truncate">Customer Received</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Delivered & completed</p>
        </button>
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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Order & Items</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Payment & Status</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Courier / Tracking</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-slate-50 shadow-[-6px_0_10px_rgba(0,0,0,0.02)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
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
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity overflow-hidden"
          onClick={() => setDetailsOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white border-l border-slate-200 h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
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

              {/* Cancellation & Refund Alert Banner */}
              {detailsOrder.status === 'cancelled' && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 space-y-2 text-xs text-rose-950">
                  <div className="flex items-center gap-2 font-black text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Order Cancelled</span>
                    {detailsOrder.cancelledAt && (
                      <span className="text-[10px] font-mono text-rose-500 font-normal">
                        ({new Date(detailsOrder.cancelledAt).toLocaleString()})
                      </span>
                    )}
                  </div>
                  <p>
                    <strong className="text-rose-900">Reason:</strong> {detailsOrder.cancellationReason || 'Cancelled by store admin'}
                  </p>
                  {detailsOrder.cancellationNotes && (
                    <p className="text-[11px] text-rose-700 italic">
                      Note: &quot;{detailsOrder.cancellationNotes}&quot;
                    </p>
                  )}
                  {detailsOrder.refundStatus && detailsOrder.refundStatus !== 'not_applicable' && (
                    <div className="pt-2 border-t border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">💰 Refund Status:</span>
                        <span className={`font-mono font-black capitalize px-2.5 py-0.5 rounded-full text-[10px] ${detailsOrder.refundStatus === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                          {detailsOrder.refundStatus === 'completed' ? 'Credited / Completed ✓' : 'Initiated / Pending ⏳'} (₹{detailsOrder.grandTotal?.toFixed(2)})
                        </span>
                      </div>
                      {detailsOrder.refundStatus === 'initiated' && (
                        <button
                          type="button"
                          onClick={() => markRefundAsCredited(detailsOrder._id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition cursor-pointer flex items-center gap-1 w-fit"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Refund as Credited</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment & Razorpay Gateway Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Payment & Gateway Details</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${detailsOrder.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : detailsOrder.paymentStatus === 'refunded' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                    {detailsOrder.paymentMethod || 'Razorpay'} • {detailsOrder.paymentStatus || 'Paid'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Razorpay Payment ID */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment ID</span>
                    {detailsOrder.paymentMetadata?.razorpay_payment_id || detailsOrder.paymentDetails?.paymentId ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs truncate">
                          {detailsOrder.paymentMetadata?.razorpay_payment_id || detailsOrder.paymentDetails?.paymentId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(detailsOrder.paymentMetadata?.razorpay_payment_id || detailsOrder.paymentDetails?.paymentId, 'Payment ID')}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                          title="Copy Payment ID"
                        >
                          {copiedKey === 'Payment ID' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono italic">
                        {detailsOrder.paymentMethod === 'COD' ? 'N/A (Cash on Delivery)' : 'pay_mock_' + (detailsOrder._id?.slice(-8) || 'online')}
                      </span>
                    )}
                  </div>

                  {/* Razorpay Order ID */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gateway Order ID</span>
                    {detailsOrder.paymentMetadata?.razorpay_order_id || detailsOrder.paymentDetails?.orderId ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs truncate">
                          {detailsOrder.paymentMetadata?.razorpay_order_id || detailsOrder.paymentDetails?.orderId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(detailsOrder.paymentMetadata?.razorpay_order_id || detailsOrder.paymentDetails?.orderId, 'Order ID')}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedKey === 'Order ID' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono italic">
                        {detailsOrder.paymentMethod === 'COD' ? 'N/A (Cash on Delivery)' : 'order_mock_' + (detailsOrder._id?.slice(-8) || 'online')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Razorpay Dashboard Link */}
                {(detailsOrder.paymentMetadata?.razorpay_payment_id || detailsOrder.paymentDetails?.paymentId) && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Need to issue refund in Razorpay?</span>
                    <a
                      href={`https://dashboard.razorpay.com/app/payments/${detailsOrder.paymentMetadata?.razorpay_payment_id || detailsOrder.paymentDetails?.paymentId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      Open in Razorpay Dashboard ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Order Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Line Items ({detailsOrder.items?.length || 0})</h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {detailsOrder.items?.map((item, idx) => {
                    const itemLink = item.productId
                      ? `/product/${item.productId}`
                      : item.isCustomDesign && item.customDesignId
                        ? `/owner/custom-designs`
                        : null;

                    return (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Product Image Thumbnail */}
                          <div className="relative w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productName || item.sku || 'Product image'}
                                width={48}
                                height={48}
                                sizes="48px"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Box className="w-5 h-5 text-slate-300" />
                            )}
                          </div>

                          {/* Product Meta */}
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-slate-900 text-sm">
                                {item.designName || item.productName || 'Catalog Product'}
                              </p>
                              {itemLink && (
                                <Link
                                  href={itemLink}
                                  target="_blank"
                                  className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5 font-bold shrink-0 text-[10px]"
                                  title="View Product in Store"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>

                            {/* Attribute Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {item.color && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-bold text-slate-700">
                                  Color: <span className="text-slate-900">{item.color}</span>
                                </span>
                              )}
                              {item.size && (
                                <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 font-bold text-orange-800">
                                  Size: <span className="text-orange-950">{item.size}</span>
                                </span>
                              )}
                              {item.brand && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 font-bold text-indigo-700">
                                  Brand: {item.brand}
                                </span>
                              )}
                              {item.category && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 pt-0.5">
                              <p className="text-[10px] font-mono text-slate-500">
                                SKU: <span className="font-bold text-slate-700">{item.sku}</span>
                              </p>
                              {itemLink && (
                                <Link
                                  href={itemLink}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 text-[10px] text-orange-600 hover:text-orange-700 font-bold"
                                >
                                  <span>Open Product Page</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-black text-slate-900">₹{item.totalPrice?.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    );
                  })}
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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => {
            setCancelModalOpen(false);
            setCancelOrderTarget(null);
          }}
        >
          <div 
            className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Cancel Order #{getDisplayOrderCode(cancelOrderTarget)}</h3>
                <p className="text-xs text-slate-500">Please provide a clear reason for your customer and records.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                <span className="font-bold text-slate-900">{cancelOrderTarget.customerName || cancelOrderTarget.userId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Value</span>
                <span className="font-black text-slate-900 font-mono">₹{cancelOrderTarget.grandTotal?.toFixed(2)}</span>
              </div>
            </div>

            {/* Reason Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs"
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Custom Notes / Message to Customer */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Additional Remarks / Note to Customer <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Apologies, the selected color is out of stock. Refund initiated."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs resize-none"
              />
            </div>

            {/* System Impact Notice */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] space-y-1 text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <span>⚡ Automatic actions on confirmation:</span>
              </div>
              <p>• Reserved items will be restored to warehouse inventory immediately.</p>
              {cancelOrderTarget.paymentStatus === 'paid' && (
                <p className="font-semibold text-emerald-800">
                  • Online payment refund will be marked as initiated to customer (3–5 business days).
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelOrderTarget(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={confirmCancelOrder}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersV2Page;

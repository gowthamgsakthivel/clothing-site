'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { getDisplayOrderCode } from '@/lib/codeGenerators';
import {
  Drawer,
  EmptyState,
  Pagination,
  StatusBadge
} from '@/components/ui';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'placed', label: 'Placed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' }
];

const SUMMARY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'Placed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'rto', label: 'RTO' },
  { key: 'failed', label: 'Failed Sync' }
];

const OrdersV2Page = () => {
  const { getToken, user, currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [shipmentFilter, setShipmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('createdAt:desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [detailsShipment, setDetailsShipment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionState, setActionState] = useState({ orderId: null, action: null });
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [packOrderId, setPackOrderId] = useState(null);
  const [packForm, setPackForm] = useState({
    lengthCm: '25',
    breadthCm: '20',
    heightCm: '3',
    weightKg: '0.3'
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!user?.id) {
        setError('Authentication not ready. Please try again.');
        return;
      }

      const token = await getToken();
      const params = new URLSearchParams();
      const [sort, order] = sortValue.split(':');

      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('sort', sort || 'createdAt');
      params.set('order', order || 'desc');

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await axios.get(`/api/admin/orders?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load orders');
      }

      setOrders(response.data.data.orders || []);
      setPagination(response.data.data.pagination || { currentPage: 1, totalPages: 1, total: 0 });
    } catch (err) {
      const message = err?.message || 'Failed to load orders';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [getToken, limit, page, search, sortValue, statusFilter, user]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      setDetailsLoading(true);
      const token = await getToken();
      const response = await axios.get(`/api/admin/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load order');
      }

      setDetailsOrder(response.data.data.order);
      setDetailsShipment(response.data.data.shipment);
      setDetailsOpen(true);
    } catch (err) {
      toast.error(err?.message || 'Failed to load order');
    } finally {
      setDetailsLoading(false);
    }
  }, [getToken]);

  const retrySync = useCallback(async (shipmentId) => {
    if (!shipmentId) return;

    try {
      setRetryingId(shipmentId);
      const token = await getToken();
      const response = await axios.post(`/api/admin/shipments/${shipmentId}/retry`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Retry failed');
      }

      toast.success('Shiprocket sync triggered');
      await fetchOrders();
      if (detailsOrder?._id) {
        await fetchOrderDetails(detailsOrder._id);
      }
    } catch (err) {
      const message = err?.message || 'Retry failed';
      toast.error(message);
    } finally {
      setRetryingId(null);
    }
  }, [detailsOrder?._id, fetchOrderDetails, fetchOrders, getToken]);

  const runLifecycleAction = useCallback(async (orderId, action, payload = {}) => {
    if (!orderId || !action) return;

    try {
      setActionState({ orderId, action });
      const token = await getToken();
      const response = await axios.patch(`/api/admin/orders/${orderId}/${action}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Action failed');
      }

      toast.success(`Order ${action}ed`);
      await fetchOrders();
      if (detailsOrder?._id) {
        await fetchOrderDetails(detailsOrder._id);
      }
    } catch (err) {
      const message = err?.message || 'Action failed';
      toast.error(message);
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

    await runLifecycleAction(packOrderId, 'pack', { packageDetails: parsed });
    closePackModal();
  }, [closePackModal, packForm, packOrderId, runLifecycleAction]);

  const printLabel = useCallback(async (shipmentId) => {
    // Deprecated: User prints label from Shiprocket directly after paying there.
    // Keeping function structure in case it's needed later, but removed UI buttons.
    return;
  }, []);

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
      const rowStatus = shipment?.externalStatus;
      const rowHighlight = rowStatus === 'failed'
        ? 'bg-red-50'
        : rowStatus === 'rto'
          ? 'bg-orange-50'
          : rowStatus === 'delivered'
            ? 'bg-emerald-50/40'
            : '';

      const canPack = order.status === 'placed';
      const canCancel = !['shipped', 'delivered', 'cancelled'].includes(order.status);

      return (
        <tr key={order._id} className={`border-b border-slate-100 transition-colors ${rowHighlight || 'hover:bg-slate-50'}`}>
          <td className="px-4 py-4 text-sm font-semibold text-blue-600">#{getDisplayOrderCode(order)}</td>
          <td className="px-4 py-4 text-sm">
            <p className="font-semibold text-slate-800">{order.customerName || 'Guest'}</p>
            <p className="text-xs text-slate-500 max-w-[120px] truncate" title={order.customerEmail || order.userId}>
              {order.customerEmail || order.userId}
            </p>
          </td>
          <td className="px-4 py-4 text-sm">
            <StatusBadge type="order" value={order.paymentStatus || 'pending'} className="capitalize" />
          </td>
          <td className="px-4 py-4 text-sm">
            <StatusBadge type="order" value={order.status} />
          </td>
          <td className="px-4 py-4 text-sm">
            <StatusBadge type="shipment" value={shipment?.externalStatus || 'unknown'} />
            {trackingLink && shipment?.trackingId && (
              <a href={trackingLink} target="_blank" rel="noreferrer" className="block mt-1 text-xs text-blue-600 hover:underline">
                Track Parcel
              </a>
            )}
          </td>
          <td className="px-4 py-4 text-sm font-semibold text-slate-900">{currency}{order.grandTotal?.toFixed(2)}</td>
          <td className="px-4 py-4 text-sm text-slate-500">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '--'}
          </td>
          <td className="px-4 py-4 text-sm">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => fetchOrderDetails(order._id)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View
              </button>

              {canPack && (
                <button
                  type="button"
                  disabled={actionState.orderId === order._id && actionState.action === 'pack'}
                  onClick={() => openPackModal(order._id)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {actionState.orderId === order._id && actionState.action === 'pack' ? 'Packing...' : 'Pack Order'}
                </button>
              )}

              {canRetry && (
                <button
                  type="button"
                  disabled={retryingId === shipment?._id}
                  onClick={() => retrySync(shipment?._id)}
                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                >
                  {retryingId === shipment?._id ? 'Retrying...' : 'Retry Sync'}
                </button>
              )}
            </div>
          </td>
        </tr>
      );
    });
  }, [actionState.action, actionState.orderId, currency, fetchOrderDetails, orders, retrySync, retryingId, runLifecycleAction, shipmentFilter]);

  const summaryCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      placed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
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
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Orders Management</h2>
          <p className="text-slate-500">Manage orders, sync with Shiprocket, and track shipments in real-time.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Export CSV
          </button>
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Syncing...' : 'Sync All Orders'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search Order ID, Phone, or Email"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="hidden lg:block h-10 w-px bg-slate-200" />
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
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
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
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
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="flex gap-6 overflow-x-auto px-2">
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
                className={`flex flex-col items-center border-b-2 px-4 py-3 text-sm ${isActive ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
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
                <span className={`font-semibold ${filter.key === 'failed' ? 'text-rose-600' : ''}`}>{filter.label}</span>
                <span className="text-xs text-slate-400">{summaryCounts[filter.key] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <EmptyState
          title="Error Loading Orders"
          description={error}
          action={(
            <button
              type="button"
              onClick={fetchOrders}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Try Again
            </button>
          )}
        />
      ) : orders.length === 0 && !loading ? (
        <EmptyState
          title="No orders found"
          description="No orders match your current filters."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4">Shipment</th>
                <th className="p-4">Total</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : rows}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <Pagination
          page={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </div>

      <Drawer
        open={detailsOpen}
        title="Order Summary"
        onClose={() => setDetailsOpen(false)}
        footer={(
          <div className="flex flex-wrap items-center justify-between w-full">
            <button
              type="button"
              disabled={!detailsOrder || ['shipped', 'delivered', 'cancelled'].includes(detailsOrder?.status) || actionState.action === 'cancel'}
              onClick={() => runLifecycleAction(detailsOrder?._id, 'cancel')}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
            >
              {actionState.action === 'cancel' ? 'Cancelling...' : 'Cancel Order'}
            </button>

            <div className="flex items-center gap-2">
              {detailsOrder?._id && (
                <Link
                  href={`/owner/orders/${detailsOrder._id}/invoice`}
                  target="_blank"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                  Print Invoice
                </Link>
              )}

              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>

              {detailsOrder?.status === 'placed' && (
                <button
                  type="button"
                  disabled={actionState.action === 'pack'}
                  onClick={() => openPackModal(detailsOrder?._id)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionState.action === 'pack' ? 'Packing...' : 'Pack Order'}
                </button>
              )}

              {detailsOrder?.status === 'packed' && (
                <div className="rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                  Shipping status will sync from Shiprocket events
                </div>
              )}
            </div>
          </div>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Order ID</p>
              <p className="text-sm font-semibold text-slate-900">#{detailsOrder?._id || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Customer</p>
              <p className="text-sm font-semibold text-slate-900">{detailsOrder?.customerName || 'Guest'}</p>
              <p className="text-xs text-slate-500">{detailsOrder?.customerEmail || detailsOrder?.userId}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Payment</p>
              <StatusBadge type="order" value={detailsOrder?.paymentStatus || 'pending'} />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Order Status</p>
              <StatusBadge type="order" value={detailsOrder?.status} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Date</p>
              <p className="text-sm font-medium text-slate-900">
                {detailsOrder?.createdAt ? new Date(detailsOrder.createdAt).toLocaleString() : '--'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total</p>
              <p className="text-sm font-bold text-slate-900">{currency}{detailsOrder?.grandTotal?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <h4 className="text-sm font-bold text-slate-900">Shipment Details</h4>
            {detailsShipment?.trackingUrl && detailsShipment?.trackingId ? (
              <a
                href={detailsShipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                Track Package
              </a>
            ) : null}
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">AWB</p>
              <p className="font-medium text-slate-900">{detailsShipment?.awb || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Courier</p>
              <p className="font-medium text-slate-900">{detailsShipment?.courier || '--'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">External Status</p>
              <div className="mt-1">
                <StatusBadge type="shipment" value={detailsShipment?.externalStatus || 'unknown'} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Tracking ID</p>
              <p className="font-medium text-slate-900">{detailsShipment?.trackingId || '--'}</p>
            </div>

            {detailsShipment?.externalStatus === 'failed' && (
              <div className="col-span-2 pt-2 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => retrySync(detailsShipment?._id)}
                  disabled={detailsLoading}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors w-full"
                >
                  {detailsLoading ? 'Retrying Sync...' : 'Retry Shiprocket Sync'}
                </button>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {packModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Enter Packed Dimensions</h3>
              <p className="text-xs text-slate-500 mt-1">These values are sent to Shiprocket for shipment creation.</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-600">
                  Length (cm)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packForm.lengthCm}
                    onChange={(event) => setPackForm((prev) => ({ ...prev, lengthCm: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Breadth (cm)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packForm.breadthCm}
                    onChange={(event) => setPackForm((prev) => ({ ...prev, breadthCm: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Height (cm)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packForm.heightCm}
                    onChange={(event) => setPackForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Weight (kg)
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={packForm.weightKg}
                    onChange={(event) => setPackForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={closePackModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPack}
                disabled={!packOrderId || (actionState.orderId === packOrderId && actionState.action === 'pack')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionState.orderId === packOrderId && actionState.action === 'pack' ? 'Packing...' : 'Save & Pack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersV2Page;

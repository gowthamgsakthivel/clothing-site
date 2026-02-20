'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [detailsShipment, setDetailsShipment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionState, setActionState] = useState({ orderId: null, action: null });

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

      const response = await axios.get(`/api/admin/orders-v2?${params.toString()}`,
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
      const response = await axios.get(`/api/admin/orders-v2/${orderId}`,
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
      const response = await axios.post(`/api/admin/shipments-v2/${shipmentId}/retry`,
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

  const runLifecycleAction = useCallback(async (orderId, action) => {
    if (!orderId || !action) return;

    try {
      setActionState({ orderId, action });
      const token = await getToken();
      const response = await axios.patch(`/api/admin/orders-v2/${orderId}/${action}`,
        {},
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
      const canShip = order.status === 'packed';
      const canDeliver = order.status === 'shipped';
      const canCancel = !['shipped', 'delivered', 'cancelled'].includes(order.status);

      return (
        <tr key={order._id} className={`border-b border-slate-100 ${rowHighlight}`}>
          <td className="px-4 py-4 text-sm font-semibold text-blue-600">#{order._id.slice(-6).toUpperCase()}</td>
          <td className="px-4 py-4 text-sm text-slate-600">{order.userId}</td>
          <td className="px-4 py-4 text-sm">
            <StatusBadge type="order" value={order.paymentStatus || 'pending'} className="capitalize" />
          </td>
          <td className="px-4 py-4 text-sm">
            <StatusBadge type="order" value={order.status} />
          </td>
          <td className="px-4 py-4 text-sm">
            <StatusBadge type="shipment" value={shipment?.externalStatus || 'unknown'} />
          </td>
          <td className="px-4 py-4 text-sm font-semibold text-slate-900">{currency}{order.grandTotal?.toFixed(2)}</td>
          <td className="px-4 py-4 text-sm text-slate-500">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '--'}
          </td>
          <td className="px-4 py-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchOrderDetails(order._id)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                View
              </button>
              <button
                type="button"
                disabled={!canPack || (actionState.orderId === order._id && actionState.action === 'pack')}
                onClick={() => runLifecycleAction(order._id, 'pack')}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {actionState.orderId === order._id && actionState.action === 'pack' ? 'Packing...' : 'Pack'}
              </button>
              <button
                type="button"
                disabled={!canShip || (actionState.orderId === order._id && actionState.action === 'ship')}
                onClick={() => runLifecycleAction(order._id, 'ship')}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {actionState.orderId === order._id && actionState.action === 'ship' ? 'Shipping...' : 'Ship'}
              </button>
              <button
                type="button"
                disabled={!canDeliver || (actionState.orderId === order._id && actionState.action === 'deliver')}
                onClick={() => runLifecycleAction(order._id, 'deliver')}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {actionState.orderId === order._id && actionState.action === 'deliver' ? 'Delivering...' : 'Deliver'}
              </button>
              <button
                type="button"
                disabled={!canCancel || (actionState.orderId === order._id && actionState.action === 'cancel')}
                onClick={() => runLifecycleAction(order._id, 'cancel')}
                className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
              >
                {actionState.orderId === order._id && actionState.action === 'cancel' ? 'Cancelling...' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!canRetry || retryingId === shipment?._id}
                onClick={() => retrySync(shipment?._id)}
                className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
              >
                {retryingId === shipment?._id ? 'Retrying...' : 'Retry'}
              </button>
              {trackingLink && shipment?.trackingId ? (
                <a href={trackingLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                  Track
                </a>
              ) : (
                <span className="text-xs text-slate-400">No tracking</span>
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
                className={`flex flex-col items-center border-b-2 px-4 py-3 text-sm ${
                  isActive ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
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
        title="Order Details"
        onClose={() => setDetailsOpen(false)}
        footer={(
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={!detailsOrder || detailsOrder?.status !== 'placed' || actionState.action === 'pack'}
              onClick={() => runLifecycleAction(detailsOrder?._id, 'pack')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              {actionState.action === 'pack' ? 'Packing...' : 'Pack'}
            </button>
            <button
              type="button"
              disabled={!detailsOrder || detailsOrder?.status !== 'packed' || actionState.action === 'ship'}
              onClick={() => runLifecycleAction(detailsOrder?._id, 'ship')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              {actionState.action === 'ship' ? 'Shipping...' : 'Ship'}
            </button>
            <button
              type="button"
              disabled={!detailsOrder || detailsOrder?.status !== 'shipped' || actionState.action === 'deliver'}
              onClick={() => runLifecycleAction(detailsOrder?._id, 'deliver')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              {actionState.action === 'deliver' ? 'Delivering...' : 'Deliver'}
            </button>
            <button
              type="button"
              disabled={!detailsOrder || ['shipped', 'delivered', 'cancelled'].includes(detailsOrder?.status) || actionState.action === 'cancel'}
              onClick={() => runLifecycleAction(detailsOrder?._id, 'cancel')}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50"
            >
              {actionState.action === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!detailsShipment || detailsShipment?.externalStatus !== 'failed' || detailsLoading}
              onClick={() => retrySync(detailsShipment?._id)}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50"
            >
              {detailsLoading ? 'Retrying...' : 'Retry Sync'}
            </button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Order</p>
              <p className="text-sm text-gray-900">#{detailsOrder?._id || '--'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="text-sm text-gray-900">{detailsOrder?.userId || '--'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Payment</p>
              <StatusBadge type="order" value={detailsOrder?.paymentStatus || 'pending'} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Order Status</p>
              <StatusBadge type="order" value={detailsOrder?.status} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm text-gray-900">
                {detailsOrder?.createdAt ? new Date(detailsOrder.createdAt).toLocaleString() : '--'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Shipment</h4>
              {detailsShipment?.trackingUrl && detailsShipment?.trackingId ? (
                <a
                  href={detailsShipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Track
                </a>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700">
              <div>
                <p className="text-xs text-slate-500">AWB</p>
                <p>{detailsShipment?.awb || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Courier</p>
                <p>{detailsShipment?.courier || '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">External Status</p>
                <StatusBadge type="shipment" value={detailsShipment?.externalStatus || 'unknown'} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tracking ID</p>
                <p>{detailsShipment?.trackingId || '--'}</p>
              </div>
              {detailsShipment?.externalStatus === 'failed' ? (
                <button
                  type="button"
                  onClick={() => retrySync(detailsShipment?._id)}
                  disabled={detailsLoading}
                  title="Retry Shiprocket Sync"
                  className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50"
                >
                  {detailsLoading ? 'Retrying...' : 'Retry Sync'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default OrdersV2Page;

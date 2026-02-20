'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import {
  Button,
  EmptyState,
  Modal,
  Pagination
} from '@/components/ui';

const SummaryCard = ({ label, value, accent }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`inline-flex items-center justify-center rounded-lg ${accent} mb-3 h-9 w-9`} />
    <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-semibold text-slate-900 mt-2">{value}</p>
  </div>
);

const Badge = ({ label, tone }) => {
  const styles = {
    red: 'bg-rose-100 text-rose-800',
    yellow: 'bg-amber-100 text-amber-800',
    gray: 'bg-gray-100 text-gray-700'
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${styles[tone]}`}>{label}</span>;
};

const BulkUpdateModal = ({ open, onClose, onSubmit, submitting }) => {
  const [rows, setRows] = useState([{ sku: '', quantityChange: '' }]);

  useEffect(() => {
    if (!open) {
      setRows([{ sku: '', quantityChange: '' }]);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="Bulk Stock Update"
      description="Use positive/negative quantities to adjust stock."
      onClose={onClose}
      footer={(
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSubmit(rows)}
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Apply Updates'}
          </Button>
        </div>
      )}
    >
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px] gap-2">
            <input
              value={row.sku}
              onChange={(event) => {
                const next = [...rows];
                next[index].sku = event.target.value;
                setRows(next);
              }}
              placeholder="SKU"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
            <input
              value={row.quantityChange}
              onChange={(event) => {
                const next = [...rows];
                next[index].quantityChange = event.target.value;
                setRows(next);
              }}
              placeholder="+10 or -3"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRows(rows.filter((_, idx) => idx !== index))}
              disabled={rows.length === 1}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRows([...rows, { sku: '', quantityChange: '' }])}
        >
          Add row
        </Button>
      </div>
    </Modal>
  );
};

const INITIAL_SUMMARY = { totalSkus: 0, lowStockSkus: 0, totalReservedUnits: 0, totalAvailableUnits: 0 };

const InventoryV2Page = () => {
  const { getToken, user } = useAppContext();
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [adjustingSku, setAdjustingSku] = useState(null);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!user?.id) {
        setError('Authentication not ready.');
        return;
      }

      const token = await getToken();
      const params = new URLSearchParams();

      params.set('page', String(page));
      params.set('limit', String(limit));
      params.set('lowStock', String(lowStockOnly));

      if (skuSearch.trim()) {
        params.set('sku', skuSearch.trim());
      }

      if (productSearch.trim()) {
        params.set('product', productSearch.trim());
      }

      const response = await axios.get(`/api/admin/inventory-v2?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load inventory');
      }

      setInventory(response.data.data.inventory || []);
      setSummary(response.data.data.summary || INITIAL_SUMMARY);
      setPagination(response.data.data.pagination || { currentPage: 1, totalPages: 1, total: 0 });
    } catch (err) {
      const message = err?.message || 'Failed to load inventory';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [getToken, limit, lowStockOnly, page, productSearch, skuSearch, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchInventory();
    }
  }, [fetchInventory, user?.id]);

  const handleBulkUpdate = async (rows) => {
    const updates = rows
      .filter((row) => row.sku && row.quantityChange !== '')
      .map((row) => ({
        sku: row.sku.trim(),
        quantityChange: Number(row.quantityChange)
      }));

    if (!updates.length) {
      toast.error('Add at least one valid update');
      return;
    }

    try {
      setBulkSubmitting(true);
      const token = await getToken();
      const response = await axios.patch('/api/admin/inventory-v2',
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Bulk update failed');
      }

      toast.success('Stock updated');
      setBulkOpen(false);
      fetchInventory();
    } catch (err) {
      const message = err?.message || 'Bulk update failed';
      toast.error(message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleQuickAdjust = useCallback(async (sku, delta) => {
    try {
      setAdjustingSku(sku);
      const token = await getToken();
      const response = await axios.patch('/api/admin/inventory-v2',
        { updates: [{ sku, quantityChange: delta }] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Update failed');
      }

      toast.success('Stock updated');
      fetchInventory();
    } catch (err) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setAdjustingSku(null);
    }
  }, [fetchInventory, getToken]);

  const rows = useMemo(() => {
    if (!inventory.length) return null;

    return inventory.map((item) => {
      const availableStock = item.availableStock ?? Math.max(0, item.totalStock - item.reservedStock);
      const lowStock = availableStock <= (item.lowStockThreshold || 0);
      const hasReserved = item.reservedStock > 0;
      const rowHighlight = lowStock ? 'bg-rose-50' : hasReserved ? 'bg-amber-50/60' : '';

      return (
        <tr key={item._id} className={`border-b border-slate-100 ${rowHighlight}`}>
          <td className="px-6 py-4 text-sm text-slate-700">{item.sku}</td>
          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.productName}</td>
          <td className="px-6 py-4 text-sm text-slate-600">{item.color}</td>
          <td className="px-6 py-4 text-sm text-slate-600">{item.size}</td>
          <td className="px-6 py-4 text-sm text-slate-700 text-center">{item.totalStock}</td>
          <td className="px-6 py-4 text-center text-sm">
            {hasReserved ? <Badge label={item.reservedStock} tone="yellow" /> : <Badge label="0" tone="gray" />}
          </td>
          <td className="px-6 py-4 text-center text-sm">
            {lowStock ? <Badge label={availableStock} tone="red" /> : <Badge label={availableStock} tone="gray" />}
          </td>
          <td className="px-6 py-4 text-sm">
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                disabled={adjustingSku === item.sku}
                onClick={() => handleQuickAdjust(item.sku, -1)}
                className="h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                -
              </button>
              <button
                type="button"
                disabled={adjustingSku === item.sku}
                onClick={() => handleQuickAdjust(item.sku, 1)}
                className="h-7 w-7 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }, [adjustingSku, handleQuickAdjust, inventory]);

  return (
    <>
      <div className="space-y-6 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory v2</h2>
            <p className="text-slate-500">Live SKU availability and reservations.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Bulk Update
            </button>
            <button
              type="button"
              onClick={fetchInventory}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Total SKUs" value={summary.totalSkus} accent="bg-blue-50" />
          <SummaryCard label="Low stock" value={summary.lowStockSkus} accent="bg-rose-50" />
          <SummaryCard label="Reserved units" value={summary.totalReservedUnits} accent="bg-amber-50" />
          <SummaryCard label="Available units" value={summary.totalAvailableUnits} accent="bg-emerald-50" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96">
              <input
                value={skuSearch}
                onChange={(event) => {
                  setPage(1);
                  setSkuSearch(event.target.value);
                }}
                placeholder="Search by SKU"
                className="w-full rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="relative w-full sm:w-96">
              <input
                value={productSearch}
                onChange={(event) => {
                  setPage(1);
                  setProductSearch(event.target.value);
                }}
                placeholder="Search by Product Name"
                className="w-full rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(event) => {
                  setPage(1);
                  setLowStockOnly(event.target.checked);
                }}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded"
              />
              Low stock only
            </label>
            <button
              type="button"
              onClick={() => {
                setSkuSearch('');
                setProductSearch('');
                setLowStockOnly(false);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {error ? (
          <EmptyState
            title="Error Loading Inventory"
            description={error}
            action={(
              <Button variant="secondary" size="sm" onClick={fetchInventory}>
                Try Again
              </Button>
            )}
          />
        ) : inventory.length === 0 && !loading ? (
          <EmptyState
            title="No inventory found"
            description="No inventory matches your filters."
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Color</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4 text-center">Total</th>
                  <th className="px-6 py-4 text-center">Reserved</th>
                  <th className="px-6 py-4 text-center">Available</th>
                  <th className="px-6 py-4 text-center">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">Loading inventory...</td>
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
      </div>

      <BulkUpdateModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSubmit={handleBulkUpdate}
        submitting={bulkSubmitting}
      />
    </>
  );
};

export default InventoryV2Page;

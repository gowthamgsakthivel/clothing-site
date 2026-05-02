'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { Button, EmptyState, Modal } from '@/components/ui';
import {
  Layers3,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-react';

const COLLECTION_OPTIONS = [
  { value: 'all', label: 'All Collections' },
  { value: 'products', label: 'Products' },
  { value: 'sports', label: 'Sports' },
  { value: 'devotional', label: 'Devotional' },
  { value: 'political', label: 'Political' }
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const INITIAL_VARIANT_FORM = {
  color: '',
  colorCode: '#000000',
  size: '',
  originalPrice: '',
  offerPrice: '',
  initialStock: '0'
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const getAvailabilityTone = (availableStock) => {
  if (availableStock <= 0) return 'text-rose-600 bg-rose-50 border-rose-100';
  if (availableStock <= 5) return 'text-amber-700 bg-amber-50 border-amber-100';
  return 'text-emerald-700 bg-emerald-50 border-emerald-100';
};

const InventoryStat = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="rounded-xl bg-orange-50 p-3 text-orange-700">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const LOW_STOCK_THRESHOLD = 5;

const VariantModal = ({
  open,
  mode,
  product,
  initialColor,
  initialColorCode,
  onClose,
  onSubmit,
  submitting
}) => {
  const [form, setForm] = useState(INITIAL_VARIANT_FORM);
  const [sizeRows, setSizeRows] = useState([]);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_VARIANT_FORM);
      setSizeRows([]);
      return;
    }

    setForm((prev) => ({
      ...prev,
      color: initialColor || prev.color || '',
      colorCode: initialColorCode !== undefined ? initialColorCode : (prev.colorCode || '#000000'),
      size: prev.size || ''
    }));
  }, [initialColor, initialColorCode, open]);

  useEffect(() => {
    if (mode === 'color' && open) {
      // initialize with one empty size row
      setSizeRows([{ size: '', originalPrice: '', offerPrice: '', initialStock: '0' }]);
    }
  }, [mode, open]);

  const title = mode === 'color' ? 'Add Color Variant' : 'Add Size Variant';
  const description = product
    ? `Add a new ${mode === 'color' ? 'color' : 'size'} for ${product.name}`
    : '';

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      className="max-w-3xl"
      footer={(
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (mode === 'color') {
                onSubmit({ color: form.color, colorCode: form.colorCode, sizes: sizeRows });
              } else {
                onSubmit(form);
              }
            }}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Variant'}
          </Button>
        </div>
      )}
    >
      {mode === 'color' ? (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Color</label>
            <input
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              placeholder="e.g. Red"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Color Code</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.colorCode}
                onChange={(event) => setForm((prev) => ({ ...prev, colorCode: event.target.value }))}
                className="h-10 w-14 rounded-lg border border-slate-200"
                aria-label="Pick color"
              />
              <input
                value={form.colorCode}
                onChange={(event) => setForm((prev) => ({ ...prev, colorCode: event.target.value }))}
                placeholder="#000000"
                maxLength={7}
                className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div className="space-y-3">
            {sizeRows.map((r, idx) => (
              <div key={idx} className="grid gap-3 sm:grid-cols-4 items-end">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Size</label>
                  <select
                    value={r.size}
                    onChange={(e) => setSizeRows((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], size: e.target.value }; return copy; })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="">Select size</option>
                    {SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Original Price</label>
                  <input type="number" min="0" step="0.01" value={r.originalPrice} onChange={(e) => setSizeRows((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], originalPrice: e.target.value }; return copy; })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Offer Price</label>
                  <input type="number" min="0" step="0.01" value={r.offerPrice} onChange={(e) => setSizeRows((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], offerPrice: e.target.value }; return copy; })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Initial Stock</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" step="1" value={r.initialStock} onChange={(e) => setSizeRows((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], initialStock: e.target.value }; return copy; })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                    <button type="button" className="text-rose-600" onClick={() => setSizeRows((prev) => prev.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                </div>
              </div>
            ))}

            <div>
              <Button variant="secondary" size="sm" onClick={() => setSizeRows((prev) => ([...prev, { size: '', originalPrice: '', offerPrice: '', initialStock: '0' }]))}>Add another size</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Color</label>
            <input
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              placeholder="e.g. Red"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Size</label>
            <select
              value={form.size}
              onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Select size</option>
              {SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Original Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.originalPrice}
              onChange={(event) => setForm((prev) => ({ ...prev, originalPrice: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Offer Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.offerPrice}
              onChange={(event) => setForm((prev) => ({ ...prev, offerPrice: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Initial Stock</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.initialStock}
              onChange={(event) => setForm((prev) => ({ ...prev, initialStock: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

const InventoryV2Page = () => {
  const { getToken, user } = useAppContext();
  const userId = user?.id;
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totalSkus: 0, lowStockSkus: 0, totalReservedUnits: 0, totalAvailableUnits: 0 });
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [inventoryRows, setInventoryRows] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [adjustingSku, setAdjustingSku] = useState(null);
  const [savingVariant, setSavingVariant] = useState(false);
  const [variantModal, setVariantModal] = useState({ open: false, mode: 'size', color: '', colorCode: '' });

  const selectedProduct = useMemo(() => {
    return products.find((product) => String(product._id) === String(selectedProductId)) || null;
  }, [products, selectedProductId]);

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const token = await getToken();
      const response = await axios.get('/api/admin/products?includeVariants=true&limit=200', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!(response.data && response.data.success)) {
        throw new Error((response.data && response.data.message) || 'Failed to load products');
      }

      const nextProducts = (response.data && response.data.data && response.data.data.products) || [];
      setProducts(nextProducts);

      if (!selectedProductId && nextProducts.length > 0) {
        setSelectedProductId(nextProducts[0]._id);
      }
    } catch (error) {
      toast.error((error && error.message) || 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, [getToken, selectedProductId]);

  const loadInventory = useCallback(async (productId) => {
    if (!productId) {
      setInventoryRows([]);
      setSummary({ totalSkus: 0, lowStockSkus: 0, totalReservedUnits: 0, totalAvailableUnits: 0 });
      return;
    }

    try {
      setLoadingInventory(true);
      const token = await getToken();
      const response = await axios.get(`/api/admin/inventory?productId=${productId}&page=1&limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!(response.data && response.data.success)) {
        throw new Error((response.data && response.data.message) || 'Failed to load inventory');
      }

      setInventoryRows((response.data && response.data.data && response.data.data.inventory) || []);
      setSummary((response.data && response.data.data && response.data.data.summary) || { totalSkus: 0, lowStockSkus: 0, totalReservedUnits: 0, totalAvailableUnits: 0 });
    } catch (error) {
      toast.error((error && error.message) || 'Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (userId) {
      loadProducts();
    }
  }, [loadProducts, userId]);

  useEffect(() => {
    if (selectedProductId) {
      loadInventory(selectedProductId);
    }
  }, [loadInventory, selectedProductId]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCollection = collectionFilter === 'all' || product.collectionName === collectionFilter;
      const matchesSearch = !term || [
        product.name,
        product.brand,
        product.category,
        product.collectionName
      ].some((field) => String(field || '').toLowerCase().includes(term));

      return matchesCollection && matchesSearch;
    });
  }, [collectionFilter, products, searchTerm]);

  const groupedVariants = useMemo(() => {
    const rows = inventoryRows || [];
    const byColor = new Map();

    rows.forEach((row) => {
      const color = row.color || 'Unknown';
      if (!byColor.has(color)) {
        byColor.set(color, []);
      }
      byColor.get(color).push(row);
    });

    return Array.from(byColor.entries()).map(([color, variants]) => ({
      color,
      variants: variants.sort((left, right) => SIZE_OPTIONS.indexOf(left.size) - SIZE_OPTIONS.indexOf(right.size))
    }));
  }, [inventoryRows]);

  const availableColors = useMemo(() => new Set(inventoryRows.map((row) => row.color).filter(Boolean)).size, [inventoryRows]);
  const totalUnits = useMemo(() => inventoryRows.reduce((total, row) => total + (row.totalStock || 0), 0), [inventoryRows]);
  const availableUnits = useMemo(() => inventoryRows.reduce((total, row) => total + (row.availableStock || 0), 0), [inventoryRows]);

  const refreshSelected = useCallback(async () => {
    await loadProducts();
    if (selectedProductId) {
      await loadInventory(selectedProductId);
    }
  }, [loadInventory, loadProducts, selectedProductId]);

  const handleStockAdjust = useCallback(async (sku, quantityChange) => {
    try {
      setAdjustingSku(sku);
      const token = await getToken();
      const response = await axios.patch('/api/admin/inventory', {
        updates: [{ sku, quantityChange }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!(response.data && response.data.success)) {
        throw new Error((response.data && response.data.message) || 'Stock update failed');
      }

      toast.success('Stock updated');
      await loadInventory(selectedProductId);
    } catch (error) {
      toast.error((error && error.message) || 'Stock update failed');
    } finally {
      setAdjustingSku(null);
    }
  }, [getToken, loadInventory, selectedProductId]);

  const handleDeleteVariant = useCallback(async (variantId, label) => {
    if (!window.confirm(`Remove ${label}? This will hide the size from inventory.`)) {
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.delete(`/api/admin/variants/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!(response.data && response.data.success)) {
        throw new Error((response.data && response.data.message) || 'Failed to remove variant');
      }

      toast.success('Variant removed');
      await refreshSelected();
    } catch (error) {
      toast.error((error && error.message) || 'Failed to remove variant');
    }
  }, [getToken, refreshSelected]);

  const submitVariant = useCallback(async (form) => {
    if (!selectedProductId) {
      toast.error('Select a product first');
      return;
    }
    // support batch create when form contains sizes (from 'color' mode)
    const token = await getToken();
    try {
      setSavingVariant(true);

      if (form && Array.isArray(form.sizes)) {
        const color = form.color && form.color.trim();
        const colorCode = form.colorCode && form.colorCode.trim();
        if (!color) {
          toast.error('Color is required');
          return;
        }
        if (!colorCode) {
          toast.error('Color code is required');
          return;
        }
        if (colorCode && !/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
          toast.error('Color code must be a valid hex value');
          return;
        }

        for (let i = 0; i < form.sizes.length; i++) {
          const row = form.sizes[i] || {};
          const size = row.size && row.size.trim();
          const originalPrice = Number(row.originalPrice);
          const offerPrice = Number(row.offerPrice || row.originalPrice);
          const initialStock = Math.max(0, Number(row.initialStock || 0));

          if (!size || !Number.isFinite(originalPrice)) {
            // skip invalid rows but inform user
            toast.error('Each size requires a size value and original price');
            continue;
          }

          const createResponse = await axios.post(`/api/admin/products/${selectedProductId}/variants`, {
            color,
            colorCode: colorCode || undefined,
            size,
            originalPrice,
            offerPrice,
            visibility: 'visible'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!(createResponse.data && createResponse.data.success)) {
            throw new Error((createResponse.data && createResponse.data.message) || 'Failed to create variant');
          }

          const createdVariant = (createResponse.data && createResponse.data.data && createResponse.data.data.variant) || null;
          if (createdVariant && initialStock > 0) {
            const stockResponse = await axios.patch('/api/admin/inventory', {
              updates: [{ sku: createdVariant.sku, quantityChange: initialStock }]
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!(stockResponse.data && stockResponse.data.success)) {
              throw new Error((stockResponse.data && stockResponse.data.message) || 'Failed to set initial stock');
            }
          }
        }

        toast.success('Variants added');
        setVariantModal({ open: false, mode: 'size', color: '', colorCode: '' });
        await refreshSelected();
      } else {
        const color = form.color && form.color.trim();
        const colorCode = form.colorCode && form.colorCode.trim();
        const size = form.size && form.size.trim();
        const originalPrice = Number(form.originalPrice);
        const offerPrice = Number(form.offerPrice || form.originalPrice);
        const initialStock = Math.max(0, Number(form.initialStock || 0));

        if (!color || !size || !Number.isFinite(originalPrice)) {
          toast.error('Color, size and original price are required');
          return;
        }
        if (!colorCode) {
          toast.error('Color code is required');
          return;
        }
        if (colorCode && !/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
          toast.error('Color code must be a valid hex value');
          return;
        }

        const createResponse = await axios.post(`/api/admin/products/${selectedProductId}/variants`, {
          color,
          colorCode: colorCode || undefined,
          size,
          originalPrice,
          offerPrice,
          visibility: 'visible'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!(createResponse.data && createResponse.data.success)) {
          throw new Error((createResponse.data && createResponse.data.message) || 'Failed to create variant');
        }

        const createdVariant = (createResponse.data && createResponse.data.data && createResponse.data.data.variant) || null;
        if (createdVariant && initialStock > 0) {
          const stockResponse = await axios.patch('/api/admin/inventory', {
            updates: [{ sku: createdVariant.sku, quantityChange: initialStock }]
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!(stockResponse.data && stockResponse.data.success)) {
            throw new Error((stockResponse.data && stockResponse.data.message) || 'Failed to set initial stock');
          }
        }

        toast.success('Variant added');
        setVariantModal({ open: false, mode: 'size', color: '', colorCode: '' });
        await refreshSelected();
      }
    } catch (error) {
      toast.error((error && error.message) || 'Failed to create variant');
    } finally {
      setSavingVariant(false);
    }
  }, [getToken, refreshSelected, selectedProductId]);

  const selectedProductSummary = useMemo(() => {
    if (!selectedProduct) {
      return null;
    }

    const totalVariants = (selectedProduct.variants && selectedProduct.variants.length) || 0;

    return {
      totalVariants,
      collectionName: selectedProduct.collectionName || 'products',
      category: selectedProduct.category || '-',
      brand: selectedProduct.brand || '-'
    };
  }, [selectedProduct]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory Management</h2>
          <p className="text-sm text-slate-500">Use the same card-based flow as add product. Pick a product, then edit its colors and sizes below.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={refreshSelected}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <InventoryStat label="Colors" value={availableColors} icon={Layers3} />
          <InventoryStat label="Sizes" value={inventoryRows.length} icon={Package} />
          <InventoryStat label="Available" value={availableUnits} icon={Plus} />
          <InventoryStat label="Reserved" value={summary.totalReservedUnits || 0} icon={Minus} />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Products</p>
                <h3 className="text-lg font-bold text-slate-900">Product list</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={refreshSelected}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {loadingProducts ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState title="No products found" description="Try a different search or collection filter." />
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => {
                    const isActive = String(product._id) === String(selectedProductId);
                    const variantCount = (product.variants && product.variants.length) || 0;
                    const productAvailableUnits = (product.variants || []).reduce((sum, v) => sum + (v.availableStock != null ? v.availableStock : (v.totalStock != null ? v.totalStock : 0)), 0);
                    const isLowStock = productAvailableUnits <= LOW_STOCK_THRESHOLD && productAvailableUnits > 0;

                    return (
                      <div
                        key={product._id}
                        className={`flex items-center justify-between gap-3 rounded-xl p-3 ${isActive ? 'border border-orange-300 bg-white' : 'border border-slate-200 bg-white hover:shadow-sm'}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.collectionName || 'products'} · {product.category || '-'}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <span>{product.brand || '-'}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{variantCount} variants</span>
                            {isLowStock && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">Low</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductId(product._id);
                              setTimeout(() => {
                                const el = document.getElementById('inventory-editor');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 120);
                            }}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div id="inventory-editor" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedProduct ? (
            <EmptyState title="Select a product" description="Tap one product card above to open its inventory." />
          ) : loadingInventory ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Loading inventory details...
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h3>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 capitalize">
                      {selectedProductSummary && selectedProductSummary.collectionName}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {(selectedProductSummary && selectedProductSummary.brand) || '-'} · {(selectedProductSummary && selectedProductSummary.category) || '-'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Edit colors, sizes, and stock in the same form-like layout as Add Product.</p>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setVariantModal({ open: true, mode: 'color', color: '', colorCode: '' })}
                    >
                      <Plus className="h-4 w-4" />
                      Add Color
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 lg:justify-end">
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">{(selectedProductSummary && selectedProductSummary.totalVariants) || 0} variants</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">{summary.totalSkus || 0} inventory rows</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">{formatCurrency(totalUnits)} stock</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {groupedVariants.length === 0 ? (
                  <EmptyState
                    title="No variants for this product"
                    description="Use Add Color to start building the inventory for this product."
                    action={(
                      <Button variant="primary" size="sm" onClick={() => setVariantModal({ open: true, mode: 'color', color: '', colorCode: '' })}>
                        Add Variant
                      </Button>
                    )}
                  />
                ) : (
                  groupedVariants.map((group) => (
                    <div key={group.color} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: (group.variants && group.variants[0] && group.variants[0].colorCode) || '#000000' }} />
                            <h4 className="text-base font-semibold text-slate-900">{group.color}</h4>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                              {group.variants.length} sizes
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Update stock for each size or add another size to this color.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setVariantModal({ open: true, mode: 'size', color: group.color, colorCode: (group.variants && group.variants[0] && group.variants[0].colorCode) || '' })}
                          >
                            <Plus className="h-4 w-4" />
                            Add Size
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {group.variants.map((row) => {
                          const availableStock = (row.availableStock != null) ? row.availableStock : Math.max(0, (row.totalStock || 0) - (row.reservedStock || 0));

                          return (
                            <div key={row._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                  <p className="text-lg font-semibold text-slate-900">{row.size}</p>
                                  <p className="text-xs text-slate-500">SKU {row.sku}</p>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getAvailabilityTone(availableStock)}`}>
                                  {availableStock} available
                                </span>
                              </div>

                              <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Total</label>
                                    <input
                                      value={row.totalStock || 0}
                                      readOnly
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Reserved</label>
                                    <input
                                      value={row.reservedStock || 0}
                                      readOnly
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Original Price</label>
                                    <input
                                      value={formatCurrency(row.originalPrice)}
                                      readOnly
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Offer Price</label>
                                    <input
                                      value={formatCurrency(row.offerPrice)}
                                      readOnly
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={adjustingSku === row.sku}
                                      onClick={() => handleStockAdjust(row.sku, -1)}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={adjustingSku === row.sku}
                                      onClick={() => handleStockAdjust(row.sku, 1)}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVariant((row.variantId && row.variantId._id) || row.variantId, `${group.color} / ${row.size}`)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      </div>

      <VariantModal
        open={variantModal.open}
        mode={variantModal.mode}
        product={selectedProduct}
        initialColor={variantModal.color}
        initialColorCode={variantModal.colorCode}
        onClose={() => setVariantModal({ open: false, mode: 'size', color: '', colorCode: '' })}
        onSubmit={submitVariant}
        submitting={savingVariant}
      />
    </div>
  );
};

export default InventoryV2Page;

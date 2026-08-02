'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import {
    Package, Palette, Plus, Search, RefreshCw,
    Save, CheckCircle2, AlertTriangle, ShieldCheck, X,
    Sparkles, Edit3
} from 'lucide-react';

const COLOR_MAP = {
    red: '#ef4444',
    purple: '#a855f7',
    blue: '#3b82f6',
    indigo: '#6366f1',
    green: '#22c55e',
    emerald: '#10b981',
    yellow: '#eab308',
    amber: '#f59e0b',
    orange: '#f97316',
    pink: '#ec4899',
    rose: '#f43f5e',
    black: '#000000',
    white: '#ffffff',
    gray: '#6b7280',
    grey: '#6b7280',
    navy: '#1e3a8a',
    cyan: '#06b6d4',
    teal: '#14b8a6',
    maroon: '#800000',
    gold: '#ffd700',
    silver: '#c0c0c0',
    brown: '#78350f'
};

const getDynamicColorHex = (colorName, colorCode) => {
    if (colorCode && colorCode !== '#6366f1' && /^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
        return colorCode;
    }
    const nameLower = (colorName || '').trim().toLowerCase();
    for (const [key, hex] of Object.entries(COLOR_MAP)) {
        if (nameLower.includes(key)) return hex;
    }
    return colorCode || '#6366f1';
};

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const OwnerInventory = () => {
    const { getToken } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [stockEdits, setStockEdits] = useState({});
    const [selectedProductKey, setSelectedProductKey] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Modal state for adding a new color & size variants
    const [showAddVariantModal, setShowAddVariantModal] = useState(false);
    const [isCreatingVariants, setIsCreatingVariants] = useState(false);
    const [newColorForm, setNewColorForm] = useState({
        colorName: '',
        colorCode: '#ef4444',
        originalPrice: '1499',
        offerPrice: '999',
        imageUrl: '',
        sizes: {
            XS: { selected: false, quantity: 10 },
            S: { selected: true, quantity: 15 },
            M: { selected: true, quantity: 25 },
            L: { selected: true, quantity: 20 },
            XL: { selected: true, quantity: 15 },
            XXL: { selected: false, quantity: 10 }
        }
    });

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const response = await axios.get('/api/admin/inventory?limit=200', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
                const rawItems = response.data.data?.inventory || response.data.inventory || response.data.products || [];
                setInventoryItems(rawItems);
                setStockEdits({});

                if (rawItems.length > 0) {
                    const firstItem = rawItems[0];
                    const firstProductName = firstItem.variantId?.productId?.name || firstItem.productName || firstItem.name || 'Default Product';
                    setSelectedProductKey((prev) => prev || firstProductName);
                }
            } else {
                toast.error(response.data?.message || 'Failed to fetch inventory');
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    // Group inventory records by Product Name
    const groupedProducts = useMemo(() => {
        const groups = {};

        inventoryItems.forEach((item) => {
            const productName = item.variantId?.productId?.name || item.productName || item.name || 'Other Catalog Items';
            const rawColor = item.variantId?.color || item.color || 'Standard';
            const rawColorCode = item.variantId?.colorCode || item.colorCode;
            const colorCode = getDynamicColorHex(rawColor, rawColorCode);
            const size = item.variantId?.size || item.size || 'M';
            const sku = item.sku || item._id;
            const totalStock = stockEdits[sku] !== undefined ? stockEdits[sku] : (item.totalStock ?? item.stockQuantity ?? 0);
            const reservedStock = item.reservedStock || 0;
            const availableStock = Math.max(0, totalStock - reservedStock);

            const productId = item.variantId?.productId?._id || item.productId || item._id;
            const sampleImage = item.variantId?.images?.[0] || item.images?.[0] || item.image || '';
            const sampleOriginalPrice = item.variantId?.originalPrice || item.originalPrice || 1499;
            const sampleOfferPrice = item.variantId?.offerPrice || item.offerPrice || 999;

            if (!groups[productName]) {
                groups[productName] = {
                    productName,
                    productId,
                    sampleImage,
                    sampleOriginalPrice,
                    sampleOfferPrice,
                    colors: {}
                };
            }

            if (!groups[productName].colors[rawColor]) {
                groups[productName].colors[rawColor] = {
                    colorName: rawColor,
                    colorCode,
                    skus: []
                };
            }

            groups[productName].colors[rawColor].skus.push({
                ...item,
                sku,
                size,
                totalStock,
                originalTotalStock: item.totalStock ?? item.stockQuantity ?? 0,
                reservedStock,
                availableStock
            });
        });

        return groups;
    }, [inventoryItems, stockEdits]);

    const productNamesList = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);

    const filteredProductNames = useMemo(() => {
        if (!searchTerm.trim()) return productNamesList;
        const term = searchTerm.toLowerCase();
        return productNamesList.filter((name) =>
            name.toLowerCase().includes(term) ||
            Object.values(groupedProducts[name].colors).some((c) =>
                c.skus.some((s) => s.sku.toLowerCase().includes(term) || c.colorName.toLowerCase().includes(term))
            )
        );
    }, [groupedProducts, productNamesList, searchTerm]);

    const activeProduct = useMemo(() => {
        if (!selectedProductKey && filteredProductNames.length > 0) {
            return groupedProducts[filteredProductNames[0]];
        }
        return groupedProducts[selectedProductKey] || groupedProducts[filteredProductNames[0]] || null;
    }, [filteredProductNames, groupedProducts, selectedProductKey]);

    const handleStockChange = (sku, currentStock, delta) => {
        const newQty = Math.max(0, currentStock + delta);
        setStockEdits((prev) => ({
            ...prev,
            [sku]: newQty
        }));
    };

    const handleSaveInventory = async () => {
        const editsToSave = Object.entries(stockEdits).filter(([sku, newStock]) => {
            const originalItem = inventoryItems.find((item) => (item.sku || item._id) === sku);
            if (!originalItem) return false;
            const originalStock = originalItem.totalStock ?? originalItem.stockQuantity ?? 0;
            return newStock !== originalStock;
        });

        if (editsToSave.length === 0) {
            toast.error('No stock modifications to save');
            return;
        }

        try {
            setIsUpdating(true);
            const token = await getToken();

            const updates = editsToSave.map(([sku, newStock]) => {
                const originalItem = inventoryItems.find((item) => (item.sku || item._id) === sku);
                const originalStock = originalItem.totalStock ?? originalItem.stockQuantity ?? 0;
                const quantityChange = newStock - originalStock;

                return {
                    sku,
                    quantityChange
                };
            });

            const response = await axios.patch(
                '/api/admin/inventory',
                { updates },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                toast.success('Inventory stock updated successfully');
                await fetchInventory();
            } else {
                toast.error(response.data?.message || 'Failed to update inventory');
            }
        } catch (error) {
            console.error('Error updating inventory:', error);
            toast.error(error.response?.data?.message || 'Failed to save stock changes');
        } finally {
            setIsUpdating(false);
        }
    };

    // Open Modal for adding a new Color Variant
    const openAddVariantModal = () => {
        if (!activeProduct) return;
        setNewColorForm({
            colorName: '',
            colorCode: '#ef4444',
            originalPrice: String(activeProduct.sampleOriginalPrice || 1499),
            offerPrice: String(activeProduct.sampleOfferPrice || 999),
            imageUrl: activeProduct.sampleImage || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80',
            sizes: {
                XS: { selected: false, quantity: 10 },
                S: { selected: true, quantity: 15 },
                M: { selected: true, quantity: 25 },
                L: { selected: true, quantity: 20 },
                XL: { selected: true, quantity: 15 },
                XXL: { selected: false, quantity: 10 }
            }
        });
        setShowAddVariantModal(true);
    };

    // Handle Color Name input change and auto-detect Color Code
    const handleColorNameChange = (name) => {
        const detectedCode = getDynamicColorHex(name, '#ef4444');
        setNewColorForm((prev) => ({
            ...prev,
            colorName: name,
            colorCode: detectedCode
        }));
    };

    // Submit new Color & Size Variants to POST /api/admin/products/[productId]/variants/bulk
    const handleCreateVariants = async (e) => {
        e.preventDefault();
        if (!activeProduct?.productId) {
            toast.error('No active product selected');
            return;
        }

        const colorName = newColorForm.colorName.trim();
        if (!colorName) {
            toast.error('Please enter a color name (e.g. Red, Crimson, Navy)');
            return;
        }

        const selectedSizes = Object.entries(newColorForm.sizes).filter(([_, data]) => data.selected);
        if (selectedSizes.length === 0) {
            toast.error('Please select at least one size variant (S, M, L, etc.)');
            return;
        }

        const imageUrl = newColorForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80';

        const variantsToCreate = selectedSizes.map(([size, data]) => ({
            color: colorName,
            colorCode: newColorForm.colorCode || getDynamicColorHex(colorName),
            size,
            originalPrice: Number(data.originalPrice || newColorForm.originalPrice || activeProduct?.sampleOriginalPrice || 1499),
            offerPrice: Number(data.offerPrice || newColorForm.offerPrice || activeProduct?.sampleOfferPrice || 999),
            images: [imageUrl],
            quantity: Number(data.quantity || 0)
        }));

        try {
            setIsCreatingVariants(true);
            const token = await getToken();

            const response = await axios.post(
                `/api/admin/products/${activeProduct.productId}/variants/bulk`,
                { variants: variantsToCreate },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                toast.success(`Added ${variantsToCreate.length} new size variants for ${colorName}!`);
                setShowAddVariantModal(false);
                await fetchInventory();
            } else {
                toast.error(response.data?.message || 'Failed to create variants');
            }
        } catch (error) {
            console.error('Error creating variant bulk:', error);
            toast.error(error.response?.data?.message || 'Failed to create new color variants');
        } finally {
            setIsCreatingVariants(false);
        }
    };

    const totalUnitsCount = useMemo(() => {
        return inventoryItems.reduce((acc, item) => {
            const sku = item.sku || item._id;
            const qty = stockEdits[sku] !== undefined ? stockEdits[sku] : (item.totalStock ?? item.stockQuantity ?? 0);
            return acc + qty;
        }, 0);
    }, [inventoryItems, stockEdits]);

    const hasUnsavedEdits = Object.keys(stockEdits).length > 0;

    return (
        <div className="space-y-8 pb-10">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stock & Inventory</h2>
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                            {totalUnitsCount} Units Total
                        </span>
                        {hasUnsavedEdits && (
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-50 text-amber-700 rounded-full border border-amber-200 animate-pulse">
                                Unsaved Edits
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Manage SKU stock levels, add new color options, and configure size matrices.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchInventory}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
                        <span>Sync</span>
                    </button>

                    <button
                        onClick={handleSaveInventory}
                        disabled={isUpdating || !hasUnsavedEdits}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm disabled:opacity-50 active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isUpdating ? 'Saving...' : 'Save Stock Changes'}</span>
                    </button>
                </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Directory */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                            <h3 className="text-sm font-extrabold text-slate-900">Products Catalog</h3>
                            <span className="text-[10px] font-mono font-bold text-slate-500">{filteredProductNames.length} Products</span>
                        </div>

                        <div className="relative mb-3">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Filter products or SKUs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                            {filteredProductNames.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                    No products found matching criteria.
                                </div>
                            ) : (
                                filteredProductNames.map((name) => {
                                    const group = groupedProducts[name];
                                    const isSelected = activeProduct?.productName === name;
                                    const totalProductStock = Object.values(group.colors).reduce(
                                        (acc, c) => acc + c.skus.reduce((sAcc, s) => sAcc + s.totalStock, 0),
                                        0
                                    );

                                    return (
                                        <div
                                            key={name}
                                            onClick={() => setSelectedProductKey(name)}
                                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                                    ? 'bg-indigo-50/60 border-indigo-200 text-slate-900 shadow-sm'
                                                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-xs truncate">{name}</p>
                                                <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                                    {Object.keys(group.colors).length} Colors
                                                </p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${totalProductStock > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                {totalProductStock} units
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Variant Editor */}
                <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6 flex flex-col justify-between">
                    {loading ? (
                        <div className="p-16 text-center text-slate-500 font-medium">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-3" />
                            Loading variant inventory...
                        </div>
                    ) : activeProduct ? (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">{activeProduct.productName}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                                        Catalog ID: {String(activeProduct.productId).slice(-8)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={openAddVariantModal}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-sm shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Color & Variants</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {Object.values(activeProduct.colors).map((colorGroup) => (
                                    <div key={colorGroup.colorName} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="w-4.5 h-4.5 rounded-full border border-slate-300 shadow-sm shrink-0"
                                                    style={{ backgroundColor: colorGroup.colorCode }}
                                                    title={`Hex Code: ${colorGroup.colorCode}`}
                                                />
                                                <h4 className="font-extrabold text-xs text-slate-900 capitalize">{colorGroup.colorName}</h4>
                                                <span className="text-[10px] font-mono text-slate-400">({colorGroup.colorCode})</span>
                                            </div>
                                            <span className="text-xs font-mono font-extrabold text-slate-600">
                                                {colorGroup.skus.reduce((acc, s) => acc + s.totalStock, 0)} Total Units
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {colorGroup.skus.map((skuRecord) => (
                                                <div key={skuRecord.sku} className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                        <span className="text-xs font-black text-slate-900">Size {skuRecord.size}</span>
                                                        <span className="text-[10px] font-mono text-indigo-600 font-bold">{skuRecord.sku}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-1">
                                                        <div className="text-[10px] text-slate-500 font-medium">
                                                            <div>Available: <strong className="text-slate-900 font-mono">{skuRecord.availableStock}</strong></div>
                                                            {skuRecord.reservedStock > 0 && (
                                                                <div className="text-amber-600 font-bold">Reserved: {skuRecord.reservedStock}</div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStockChange(skuRecord.sku, skuRecord.totalStock, -1)}
                                                                className="w-6 h-6 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs transition-all shadow-xs border border-slate-200"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="font-mono font-extrabold text-xs text-slate-900 w-7 text-center">
                                                                {skuRecord.totalStock}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStockChange(skuRecord.sku, skuRecord.totalStock, 1)}
                                                                className="w-6 h-6 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs transition-all shadow-xs border border-slate-200"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-16 text-center text-slate-400">
                            Select a product from the directory list to edit variant inventory.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Adding New Color & Size Variants */}
            {showAddVariantModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Add New Color Variant</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{activeProduct?.productName}</p>
                            </div>
                            <button onClick={() => setShowAddVariantModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVariants} className="space-y-5 text-xs">
                            {/* Color Name & Code Picker */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Color Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Crimson Red, Navy Blue"
                                        value={newColorForm.colorName}
                                        onChange={(e) => handleColorNameChange(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Color Hex Code</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newColorForm.colorCode}
                                            onChange={(e) => setNewColorForm((prev) => ({ ...prev, colorCode: e.target.value }))}
                                            className="h-10 w-12 rounded-xl border border-slate-200 bg-white cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={newColorForm.colorCode}
                                            onChange={(e) => setNewColorForm((prev) => ({ ...prev, colorCode: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-900 font-mono font-bold uppercase focus:bg-white focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Original Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={newColorForm.originalPrice}
                                        onChange={(e) => setNewColorForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1">Offer Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={newColorForm.offerPrice}
                                        onChange={(e) => setNewColorForm((prev) => ({ ...prev, offerPrice: e.target.value }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-emerald-600 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Size Selection & Pricing Matrix */}
                            <div>
                                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-2">
                                    Configure Size Variants, Stock & Optional Custom Prices *
                                </label>
                                <div className="space-y-3">
                                    {AVAILABLE_SIZES.map((size) => {
                                        const sizeData = newColorForm.sizes[size] || { selected: false, quantity: 0, lowStockThreshold: 5, originalPrice: '', offerPrice: '' };
                                        return (
                                            <div
                                                key={size}
                                                className={`p-3 rounded-2xl border transition-all space-y-2.5 ${sizeData.selected ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/50 border-slate-200 opacity-60'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(sizeData.selected)}
                                                            onChange={(e) => setNewColorForm((prev) => ({
                                                                ...prev,
                                                                sizes: {
                                                                    ...prev.sizes,
                                                                    [size]: { ...sizeData, selected: e.target.checked }
                                                                }
                                                            }))}
                                                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                        />
                                                        <span className="font-black text-slate-900 text-sm">Size {size}</span>
                                                    </label>
                                                </div>

                                                {sizeData.selected && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-indigo-100/60">
                                                        <div>
                                                            <span className="text-[9px] text-slate-500 font-extrabold block uppercase mb-0.5">Stock Amount</span>
                                                            <input
                                                                type="number"
                                                                value={sizeData.quantity}
                                                                onChange={(e) => setNewColorForm((prev) => ({
                                                                    ...prev,
                                                                    sizes: {
                                                                        ...prev.sizes,
                                                                        [size]: { ...sizeData, quantity: parseInt(e.target.value) || 0 }
                                                                    }
                                                                }))}
                                                                className="w-full text-center rounded-xl border border-slate-200 bg-white py-1.5 text-slate-900 font-mono font-bold focus:border-indigo-500 focus:outline-none text-xs"
                                                                min="0"
                                                            />
                                                        </div>

                                                        <div>
                                                            <span className="text-[9px] text-slate-500 font-extrabold block uppercase mb-0.5">Low Alert Threshold</span>
                                                            <input
                                                                type="number"
                                                                value={sizeData.lowStockThreshold || 5}
                                                                onChange={(e) => setNewColorForm((prev) => ({
                                                                    ...prev,
                                                                    sizes: {
                                                                        ...prev.sizes,
                                                                        [size]: { ...sizeData, lowStockThreshold: parseInt(e.target.value) || 5 }
                                                                    }
                                                                }))}
                                                                className="w-full text-center rounded-xl border border-slate-200 bg-white py-1.5 text-slate-600 font-mono font-bold focus:border-indigo-500 focus:outline-none text-xs"
                                                                min="1"
                                                            />
                                                        </div>

                                                        <div>
                                                            <span className="text-[9px] text-slate-500 font-extrabold block uppercase mb-0.5">Original Price (opt)</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Default"
                                                                value={sizeData.originalPrice || ''}
                                                                onChange={(e) => setNewColorForm((prev) => ({
                                                                    ...prev,
                                                                    sizes: {
                                                                        ...prev.sizes,
                                                                        [size]: { ...sizeData, originalPrice: e.target.value }
                                                                    }
                                                                }))}
                                                                className="w-full text-center rounded-xl border border-slate-200 bg-white py-1.5 text-slate-800 font-mono font-semibold focus:border-indigo-500 focus:outline-none text-xs"
                                                                min="0"
                                                            />
                                                        </div>

                                                        <div>
                                                            <span className="text-[9px] text-slate-500 font-extrabold block uppercase mb-0.5">Offer Price (opt)</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Default"
                                                                value={sizeData.offerPrice || ''}
                                                                onChange={(e) => setNewColorForm((prev) => ({
                                                                    ...prev,
                                                                    sizes: {
                                                                        ...prev.sizes,
                                                                        [size]: { ...sizeData, offerPrice: e.target.value }
                                                                    }
                                                                }))}
                                                                className="w-full text-center rounded-xl border border-slate-200 bg-white py-1.5 text-emerald-600 font-mono font-bold focus:border-indigo-500 focus:outline-none text-xs"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddVariantModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingVariants}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>{isCreatingVariants ? 'Creating...' : 'Create Size Variants'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerInventory;

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, X, Plus, Sparkles, CheckCircle2, Image as ImageIcon, Save } from 'lucide-react';
import { getProductSummary } from '@/lib/v2ProductView';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';

const FeaturedProductsPage = () => {
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const summarizeProduct = (bundle) => {
    if (!bundle?.product) return null;
    const summary = getProductSummary(bundle);
    return {
      ...summary,
      image: summary.images?.[0] || '',
    };
  };

  useEffect(() => {
    const loadFeaturedData = async () => {
      setLoading(true);
      try {
        const [featuredResponse, productsResponse] = await Promise.all([
          fetch('/api/featured-products'),
          fetch('/api/product/list?limit=200')
        ]);

        const [featuredData, productsData] = await Promise.all([
          featuredResponse.json().catch(() => ({})),
          productsResponse.json().catch(() => ({}))
        ]);

        if (featuredData?.success) {
          setFeaturedProductIds(Array.isArray(featuredData.featuredProductIds) ? featuredData.featuredProductIds : []);
          setFeaturedProducts(Array.isArray(featuredData.featuredProducts) ? featuredData.featuredProducts : []);
        }

        if (productsData?.success) {
          const summaries = (productsData.products || [])
            .map(summarizeProduct)
            .filter(Boolean);
          setAvailableProducts(summaries);
        }
      } catch (error) {
        console.error('Failed to load featured products', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedData();
  }, []);

  const toggleFeaturedProduct = (product) => {
    if (!product?._id) return;

    setFeaturedProductIds((current) => {
      const exists = current.includes(product._id);
      return exists ? current.filter((id) => id !== product._id) : [...current, product._id];
    });

    setFeaturedProducts((current) => {
      const exists = current.some((item) => item._id === product._id);
      return exists ? current.filter((item) => item._id !== product._id) : [...current, product];
    });
  };

  const removeFeaturedProduct = (product) => {
    toggleFeaturedProduct(product);
  };

  const saveFeaturedProducts = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/featured-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredProductIds }),
      });
      const data = await response.json();
      if (data.success) {
        setFeaturedProductIds(Array.isArray(data.featuredProductIds) ? data.featuredProductIds : []);
        setFeaturedProducts(Array.isArray(data.featuredProducts) ? data.featuredProducts : []);
        toast.success('Featured products updated');
      } else {
        toast.error(data.message || 'Failed to save featured products');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save featured products');
    } finally {
      setSaving(false);
    }
  };

  const visibleAvailableProducts = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    const selectedIds = new Set(featuredProductIds.map((id) => String(id)));

    return availableProducts.filter((product) => {
      if (selectedIds.has(String(product._id))) return false;
      if (!searchLower) return true;
      return [product.name, product.description, product.brand, product.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchLower);
    });
  }, [availableProducts, featuredProductIds, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28 text-slate-500">
        <Loading size="lg" text="Loading Homepage Showcase Products..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Homepage Featured Showcase</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {featuredProducts.length} Featured
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Select and order products to display in the main homepage hero & featured slider.</p>
        </div>

        <button
          onClick={saveFeaturedProducts}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm disabled:opacity-50 active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Showcase Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Selected Featured Products Panel */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Active Featured Banner ({featuredProducts.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Currently pinned to storefront hero grid</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {featuredProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-900">No showcase products selected</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Search and pin products from the available catalog on the right.</p>
                </div>
              ) : (
                featuredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {product.image ? (
                        <div className="relative h-14 w-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{product.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{product.brand || 'Store Item'}</p>
                        <p className="text-xs font-mono font-black text-emerald-600 mt-1">
                          ₹{product.offerPrice || product.price}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFeaturedProduct(product)}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all shrink-0"
                      title="Remove from featured"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Available Products Directory */}
        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Catalog Directory ({visibleAvailableProducts.length})</h3>
                <p className="text-xs text-slate-500 mt-0.5">Search and select items to feature</p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title, brand, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
              {visibleAvailableProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  {searchTerm ? 'No matching products found.' : 'All available products are currently pinned.'}
                </div>
              ) : (
                visibleAvailableProducts.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => toggleFeaturedProduct(product)}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-200/80 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image && (
                        <div className="relative h-12 w-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{product.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{product.brand || 'Store Item'}</p>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 border border-indigo-100">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProductsPage;

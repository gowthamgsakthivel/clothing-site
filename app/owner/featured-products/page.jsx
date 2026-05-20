'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, X, Check } from 'lucide-react';
import { getProductSummary } from '@/lib/v2ProductView';

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
        alert('Featured products saved successfully');
      } else {
        alert(data.message || 'Failed to save featured products');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save featured products');
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
      <div className="p-8">
        <div className="text-slate-500">Loading featured products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">Product Management</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Featured Products</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Select products to showcase in the Featured Collections section on your homepage. You can add or remove products and reorder them.
              </p>
            </div>
            <button
              onClick={saveFeaturedProducts}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Selected Products */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Featured Products ({featuredProducts.length})
              </h2>
              <p className="mt-1 text-sm text-slate-500">Products currently featured on homepage</p>
            </div>

            <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
              {featuredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No products selected yet.</p>
                  <p className="text-xs mt-2">Search and add products from the right panel.</p>
                </div>
              ) : (
                featuredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {product.image && (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{product.name}</h3>
                      <p className="text-xs text-slate-500">{product.brand}</p>
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        ₹{product.offerPrice || product.price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFeaturedProduct(product)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      title="Remove from featured"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Products */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Available Products ({visibleAvailableProducts.length})
              </h2>
              <p className="mt-1 text-sm text-slate-500">Search and select products to add</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, brand, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>

              {/* Products List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {visibleAvailableProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">
                      {searchTerm ? 'No products found matching your search.' : 'All products are already featured.'}
                    </p>
                  </div>
                ) : (
                  visibleAvailableProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => toggleFeaturedProduct(product)}
                      className="w-full flex items-start gap-3 p-3 bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors text-left"
                    >
                      {product.image && (
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{product.name}</h3>
                        <p className="text-xs text-slate-500">{product.brand}</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">{product.category}</p>
                      </div>
                      <div className="p-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex-shrink-0">
                        <Check size={16} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProductsPage;

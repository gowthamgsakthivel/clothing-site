'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import {
  Boxes, Plus, Search, Filter, RefreshCw, Trash2, Edit3,
  Sparkles, Layers, Image as ImageIcon, CheckCircle2, X, ExternalLink
} from 'lucide-react';

const OwnerProducts = () => {
  const { getToken } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollection, setFilterCollection] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await axios.get('/api/admin/products?limit=200&includeVariants=true', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const rawProducts = response.data.data?.products || response.data.products || [];
        setProducts(rawProducts);
      } else {
        toast.error(response.data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (productId) => {
    try {
      const token = await getToken();
      const response = await axios.delete(`/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Product deleted successfully');
        setDeleteConfirmation(null);
        fetchProducts();
      } else {
        toast.error(response.data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productCode?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollection =
        filterCollection === 'all' || p.collectionName === filterCollection;

      return matchesSearch && matchesCollection;
    });
  }, [products, searchTerm, filterCollection]);

  const getPriceRange = (variants = []) => {
    if (!variants.length) return 'N/A';
    const prices = variants.map((v) => v.offerPrice || v.price).filter(Boolean);
    if (!prices.length) return 'N/A';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  };

  const getTotalStock = (variants = []) => {
    return variants.reduce((acc, v) => acc + (v.stockQuantity || 0), 0);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Products Catalog</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {products.length} Products Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage master store catalog, variants, and collection assignments.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Catalog</span>
          </button>

          <Link
            href="/owner/add-product"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title, product code, or brand name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterCollection}
            onChange={(e) => setFilterCollection(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Collections</option>
            <option value="products">General Products</option>
            <option value="sports">Sports Apparel</option>
            <option value="devotional">Devotional</option>
            <option value="political">Political</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-medium">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-3" />
            Loading catalog items...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Boxes className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-extrabold text-slate-900">No products found</h4>
            <p className="text-xs text-slate-500 mt-1">Try refining your search terms or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Collection / Cat</th>
                  <th className="px-6 py-4">Price Range</th>
                  <th className="px-6 py-4">Total Units</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const firstVariant = product.variants?.[0];
                  const firstImage = firstVariant?.images?.[0] || product.image;
                  const totalStock = getTotalStock(product.variants);

                  return (
                    <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          {firstImage ? (
                            <div className="relative h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                              <Image
                                src={firstImage}
                                alt={product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs">{product.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{product.brand || 'No Brand'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 font-bold">
                        {product.productCode || '--'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                          {product.collectionName || 'products'}
                        </span>
                        {product.category && (
                          <span className="block text-[10px] text-slate-500 mt-1 font-semibold">
                            {product.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-slate-900">
                        {getPriceRange(product.variants)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {totalStock} units ({product.variants?.length || 0} SKUs)
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${product.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Link
                            href={`/product/${product._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs"
                            title="Open public customer product page in a new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View Page</span>
                          </Link>

                          <Link
                            href={`/owner/products/${product._id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-xs"
                            title="Edit full product details, prices, and imagery"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </Link>

                          <Link
                            href={`/owner/inventory?search=${encodeURIComponent(product.name)}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-xs"
                            title="Direct access to stock quantities and size matrix"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Inventory</span>
                          </Link>

                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
                            title="Quick view variant SKUs"
                          >
                            Variants
                          </button>

                          <button
                            onClick={() => setDeleteConfirmation(product._id)}
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Delete Product Permanently?</h3>
              <p className="text-xs text-slate-500">
                This action cannot be undone. All associate variant SKUs will be purged from stock listings.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmation)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Variant SKUs & Inventory Matrix</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedProduct.variants?.map((v, i) => (
                <div key={v._id || i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-600">{v.sku}</span>
                    <span className="font-extrabold text-slate-900 font-mono">₹{v.offerPrice || v.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: v.colorCode || '#000' }} />
                    <span className="font-bold text-slate-800">{v.color} / {v.size}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Stock Quantity: <strong className="text-slate-900">{v.stockQuantity} units</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/product/${selectedProduct._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  title="Open public customer product page in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>View Store Page</span>
                </Link>
                <Link
                  href={`/owner/products/${selectedProduct._id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Product Details</span>
                </Link>
                <Link
                  href={`/owner/inventory?search=${encodeURIComponent(selectedProduct.name)}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Manage Stock</span>
                </Link>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProducts;

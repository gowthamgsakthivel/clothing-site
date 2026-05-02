'use client'
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";

const OwnerProductList = () => {
  const { router, getToken, user } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [variantProduct, setVariantProduct] = useState(null)
  const [deletingProductId, setDeletingProductId] = useState(null)
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null)
  const [variantInventoryMap, setVariantInventoryMap] = useState({})
  const [loadingVariantInventory, setLoadingVariantInventory] = useState(false)

  const toCode = useCallback((value, length, fallback = 'X') => {
    const cleaned = (value || '')
      .toString()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    return cleaned.slice(0, length).padEnd(length, fallback);
  }, []);

  const buildProductCode = useCallback((product) => {
    const slug = product?.slug || 'prd';
    const slugCode = toCode(slug, 3);
    const suffix = toCode(product?._id?.toString().slice(-4), 4, '0');
    return `${slugCode}-${suffix}`;
  }, [toCode]);

  const getStatusBadge = (status) => {
    const normalized = status || 'draft';
    if (normalized === 'active') {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>;
    }
    if (normalized === 'hidden') {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Hidden</span>;
    }
    if (normalized === 'archived') {
      return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">Archived</span>;
    }
    return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Draft</span>;
  };

  const getPriceSummary = (variants) => {
    if (!variants?.length) {
      return { offer: null, original: null };
    }
    const offers = variants.map((variant) => variant.offerPrice ?? variant.originalPrice).filter((price) => typeof price === 'number');
    const originals = variants.map((variant) => variant.originalPrice).filter((price) => typeof price === 'number');
    if (!offers.length && !originals.length) {
      return { offer: null, original: null };
    }
    return {
      offer: offers.length ? Math.min(...offers) : null,
      original: originals.length ? Math.max(...originals) : null
    };
  };

  const openVariantModal = (product) => {
    setVariantProduct(product);
    setVariantModalOpen(true);
  };

  useEffect(() => {
    if (!variantModalOpen || !variantProduct?._id) {
      setVariantInventoryMap({});
      return;
    }

    let isMounted = true;

    const loadInventory = async () => {
      try {
        setLoadingVariantInventory(true);
        const token = await getToken();
        const response = await axios.get(`/api/admin/inventory?productId=${variantProduct._id}&page=1&limit=200`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (isMounted && response.data?.success) {
          const rows = response.data?.data?.inventory || [];
          const map = rows.reduce((acc, row) => {
            const variantId = row?.variantId?._id || row?.variantId;
            if (variantId) {
              acc[String(variantId)] = row.availableStock ?? row.totalStock ?? 0;
            }
            return acc;
          }, {});
          setVariantInventoryMap(map);
        }
      } catch (error) {
        if (isMounted) setVariantInventoryMap({});
      } finally {
        if (isMounted) setLoadingVariantInventory(false);
      }
    };

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, [getToken, variantModalOpen, variantProduct?._id]);

  const deleteProduct = async (productId) => {
    try {
      setDeletingProductId(productId);
      const token = await getToken();
      const response = await axios.delete(`/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((product) => product._id !== productId));
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeletingProductId(null);
      setConfirmDeleteProduct(null);
    }
  };

  const fetchOwnerProducts = useCallback(async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get('/api/admin/products?includeVariants=true', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const nextProducts = data?.data?.products || [];
        const withVariants = nextProducts.map((product) => ({
          ...product,
          productCode: buildProductCode(product)
        }));
        setProducts(withVariants)
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [buildProductCode, getToken]);

  useEffect(() => {
    if (user) {
      fetchOwnerProducts();
    }
  }, [user, fetchOwnerProducts])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.collectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {loading ? <Loading /> : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Products</h2>
              <p className="text-sm text-slate-500">Manage your product catalog and inventory variants</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Filters
              </button>
              <Link
                href="/owner/add-product"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Product
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                placeholder="Search products, SKU, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-6 text-sm text-slate-600">
              <span>Total Products: <strong className="text-slate-900">{products.length}</strong></span>
              <span>Filtered: <strong className="text-slate-900">{filteredProducts.length}</strong></span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Collection</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Price Range</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Inventory</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const summary = getPriceSummary(product.variants);
                      const minPrice = summary.offer ?? summary.original;
                      const maxPrice = summary.original ?? summary.offer;
                      const priceLabel = minPrice !== null && maxPrice !== null
                        ? `₹${minPrice} - ₹${maxPrice}`
                        : 'No pricing';

                      return (
                        <tr key={product._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {product.variants?.[0]?.images?.[0] ? (
                                  <Image
                                    src={product.variants[0].images[0]}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                    width={48}
                                    height={48}
                                  />
                                ) : (
                                  <div className="text-xs text-slate-400">No Image</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate" title={product.name}>{product.name}</p>
                                <p className="text-xs text-slate-500">SKU: {product.productCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 capitalize">
                              {product.collectionName || 'sports'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{product.brand || '-'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{priceLabel}</td>
                          <td className="px-6 py-4">
                            {getStatusBadge(product.status)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => router.push(`/owner/inventory?product=${product._id}`)}
                              className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100"
                            >
                              {product.variants?.length || 0} variants
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => router.push(`/product/${product._id}`)}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openVariantModal(product)}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                Variants
                              </button>
                              <button
                                onClick={() => setConfirmDeleteProduct(product)}
                                className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                disabled={deletingProductId === product._id}
                              >
                                {deletingProductId === product._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-slate-500">
                        {searchTerm ? (
                          <div>
                            <p>No products found matching &quot;{searchTerm}&quot;</p>
                            <button
                              onClick={() => setSearchTerm('')}
                              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Clear search
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p>No products found</p>
                            <Link
                              href="/owner/add-product"
                              className="mt-2 inline-block text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Add your first product
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {variantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{variantProduct?.name || 'Variants'}</h3>
                  <p className="text-xs text-slate-500">{variantProduct?.productCode} - {(variantProduct?.variants || []).length} Variants</p>
                </div>
              </div>
              <button
                onClick={() => setVariantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                x
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              {(variantProduct?.variants || []).length === 0 ? (
                <p className="text-sm text-slate-500">No variants available.</p>
              ) : (
                <div className="space-y-4">
                  {loadingVariantInventory && (
                    <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                      Loading inventory...
                    </div>
                  )}
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">SKU / Variant</th>
                          <th className="px-4 py-3 text-left">Original Price</th>
                          <th className="px-4 py-3 text-left">Offer Price</th>
                          <th className="px-4 py-3 text-right">Inventory</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(variantProduct?.variants || []).map((variant) => {
                          return (
                            <tr key={variant._id}>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${variant.visibility === 'hidden' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                                  {variant.visibility === 'hidden' ? 'Hidden' : 'Visible'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-900">{variant.color} / {variant.size}</div>
                                <div className="text-xs text-slate-500">{variant.sku}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-slate-700">₹{variant.originalPrice}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-slate-700">₹{variant.offerPrice}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {loadingVariantInventory ? (
                                  <span className="inline-flex items-center justify-end text-slate-400" aria-label="Loading inventory">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-900">
                                    {variantInventoryMap[variant._id] ?? 0}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setVariantModalOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Delete product</h3>
              <p className="mt-1 text-sm text-slate-500">
                This will permanently remove the product and its variants.
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-slate-700">{confirmDeleteProduct?.name}</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setConfirmDeleteProduct(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
                disabled={deletingProductId === confirmDeleteProduct?._id}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProduct(confirmDeleteProduct._id)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                disabled={deletingProductId === confirmDeleteProduct?._id}
              >
                {deletingProductId === confirmDeleteProduct?._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProductList;

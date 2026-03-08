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
  const [variantEdits, setVariantEdits] = useState({})
  const [variantAction, setVariantAction] = useState({ id: null, action: null })

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
    const initialEdits = (product?.variants || []).reduce((acc, variant) => {
      acc[variant._id] = {
        originalPrice: variant.originalPrice,
        offerPrice: variant.offerPrice,
        visibility: variant.visibility || 'visible'
      };
      return acc;
    }, {});
    setVariantEdits(initialEdits);
    setVariantModalOpen(true);
  };

  const updateVariantField = (variantId, field, value) => {
    setVariantEdits((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value
      }
    }));
  };

  const applyVariantUpdate = async (variantId) => {
    try {
      setVariantAction({ id: variantId, action: 'save' });
      const token = await getToken();
      const payload = variantEdits[variantId];

      const response = await axios.patch(`/api/admin/variants/${variantId}`,
        {
          originalPrice: Number(payload?.originalPrice),
          offerPrice: Number(payload?.offerPrice),
          visibility: payload?.visibility
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update variant');
      }

      const updatedVariant = response.data?.data?.variant;
      if (updatedVariant) {
        setProducts((prev) => prev.map((product) => (
          product._id === variantProduct?._id
            ? { ...product, variants: product.variants.map((variant) => (variant._id === variantId ? updatedVariant : variant)) }
            : product
        )));
        setVariantProduct((prev) => prev
          ? { ...prev, variants: prev.variants.map((variant) => (variant._id === variantId ? updatedVariant : variant)) }
          : prev
        );
      }

      toast.success('Variant updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update variant');
    } finally {
      setVariantAction({ id: null, action: null });
    }
  };

  const hideVariant = async (variantId) => {
    try {
      setVariantAction({ id: variantId, action: 'hide' });
      const token = await getToken();
      const response = await axios.patch(`/api/admin/variants/${variantId}`,
        { visibility: 'hidden' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to hide variant');
      }

      const updatedVariant = response.data?.data?.variant;
      if (updatedVariant) {
        setProducts((prev) => prev.map((product) => (
          product._id === variantProduct?._id
            ? { ...product, variants: product.variants.map((variant) => (variant._id === variantId ? updatedVariant : variant)) }
            : product
        )));
        setVariantProduct((prev) => prev
          ? { ...prev, variants: prev.variants.map((variant) => (variant._id === variantId ? updatedVariant : variant)) }
          : prev
        );
      }

      toast.success('Variant hidden');
    } catch (error) {
      toast.error(error.message || 'Failed to hide variant');
    } finally {
      setVariantAction({ id: null, action: null });
    }
  };

  const deleteVariant = async (variantId) => {
    try {
      setVariantAction({ id: variantId, action: 'delete' });
      const token = await getToken();
      const response = await axios.delete(`/api/admin/variants/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete variant');
      }

      const updatedVariant = response.data?.data?.variant;
      if (updatedVariant) {
        setProducts((prev) => prev.map((product) => (
          product._id === variantProduct?._id
            ? { ...product, variants: product.variants.map((variant) => (variant._id === variantId ? updatedVariant : variant)) }
            : product
        )));
        setVariantProduct((prev) => prev
          ? { ...prev, variants: prev.variants.map((variant) => (variant._id === variantId ? updatedVariant : variant)) }
          : prev
        );
      }

      toast.success('Variant deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete variant');
    } finally {
      setVariantAction({ id: null, action: null });
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
                            <div className="flex justify-end gap-2">
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
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
                  <h3 className="text-lg font-semibold text-slate-900">{variantProduct?.name || 'Manage Variants'}</h3>
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
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Manage Variants</span>
                    <button className="text-blue-600 hover:underline">Bulk Edit</button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Visible</th>
                          <th className="px-4 py-3 text-left">SKU / Variant</th>
                          <th className="px-4 py-3 text-left">Original Price</th>
                          <th className="px-4 py-3 text-left">Offer Price</th>
                          <th className="px-4 py-3 text-right">Inventory</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(variantProduct?.variants || []).map((variant) => {
                          const draft = variantEdits[variant._id] || {};
                          const isSaving = variantAction.id === variant._id && variantAction.action === 'save';
                          const isHiding = variantAction.id === variant._id && variantAction.action === 'hide';
                          const isDeleting = variantAction.id === variant._id && variantAction.action === 'delete';

                          return (
                            <tr key={variant._id}>
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={(draft.visibility ?? variant.visibility) === 'visible'}
                                  onChange={(event) => updateVariantField(variant._id, 'visibility', event.target.checked ? 'visible' : 'hidden')}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-900">{variant.color} / {variant.size}</div>
                                <div className="text-xs text-slate-500">{variant.sku}</div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={draft.originalPrice ?? variant.originalPrice}
                                  onChange={(event) => updateVariantField(variant._id, 'originalPrice', event.target.value)}
                                  className="w-28 rounded-md border border-slate-200 px-2 py-1 text-sm"
                                  min="0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={draft.offerPrice ?? variant.offerPrice}
                                  onChange={(event) => updateVariantField(variant._id, 'offerPrice', event.target.value)}
                                  className="w-28 rounded-md border border-slate-200 px-2 py-1 text-sm"
                                  min="0"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-semibold text-slate-900">{variant.inventory ?? variant.stock ?? 0}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => applyVariantUpdate(variant._id)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-60"
                                    disabled={isSaving}
                                  >
                                    {isSaving ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => hideVariant(variant._id)}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs hover:bg-slate-200 disabled:opacity-60"
                                    disabled={isHiding}
                                  >
                                    {isHiding ? 'Hiding...' : 'Hide'}
                                  </button>
                                  <button
                                    onClick={() => deleteVariant(variant._id)}
                                    className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs hover:bg-rose-700 disabled:opacity-60"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
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
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => setVariantModalOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProductList;

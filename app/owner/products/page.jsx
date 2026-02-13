'use client'
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";

const OwnerProductList = () => {
  const { router, getToken, user } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchOwnerProducts = useCallback(async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get('/api/product/seller-products', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setProducts(data.products)
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

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

  const getStockStatusBadge = (totalStock, lowStockThreshold = 10) => {
    if (totalStock === 0) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Out of Stock</span>;
    } else if (totalStock <= lowStockThreshold) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">In Stock</span>;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : (
        <div className="w-full md:p-10 p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Product List</h2>
              <p className="text-gray-600">Manage and view your product catalog</p>
            </div>

            <div className="flex gap-3">
              <Link href="/owner/add-product" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Add New Product
              </Link>
              <Link href="/owner/inventory" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Manage Stock
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-6 text-sm text-gray-600">
              <span>Total Products: <strong className="text-gray-800">{products.length}</strong></span>
              <span>Filtered: <strong className="text-gray-800">{filteredProducts.length}</strong></span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 text-gray-900 text-sm text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium max-md:hidden">Category</th>
                    <th className="px-4 py-3 font-medium max-md:hidden">Brand</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600 divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 rounded-lg p-2 flex-shrink-0">
                              {product.image?.[0] ? (
                                <Image
                                  src={product.image[0]}
                                  alt={product.name}
                                  className="w-10 h-10 md:w-12 md:h-12 object-cover rounded"
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-400 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="font-medium text-gray-900 truncate max-w-full" title={product.name}>
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-md:hidden">
                                {product.description?.substring(0, 40)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 max-md:hidden">
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded truncate block">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 max-md:hidden truncate">{product.brand}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col whitespace-nowrap">
                            <span className="font-medium text-gray-900 text-sm">₹{product.offerPrice}</span>
                            {product.price !== product.offerPrice && (
                              <span className="text-xs text-gray-500 line-through">₹{product.price}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            {getStockStatusBadge(product.totalStock || product.stock, product.stockSettings?.globalLowStockThreshold)}
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {product.totalStock || product.stock || 0} units
                            </span>
                            {product.inventory?.length > 0 && (
                              <span className="text-xs text-blue-600 whitespace-nowrap">
                                {product.inventory.length} colors
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => router.push(`/product/${product._id}`)}
                              className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-xs whitespace-nowrap"
                              title="View Product"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="hidden sm:inline">View</span>
                            </button>

                            <button
                              onClick={() => router.push(`/owner/inventory?product=${product._id}`)}
                              className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs whitespace-nowrap"
                              title="Manage Stock"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span className="hidden sm:inline">Stock</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        {searchTerm ? (
                          <div>
                            <p>No products found matching &quot;{searchTerm}&quot;</p>
                            <button
                              onClick={() => setSearchTerm('')}
                              className="mt-2 text-orange-600 hover:text-orange-700 text-sm"
                            >
                              Clear search
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p>No products found</p>
                            <Link
                              href="/owner/add-product"
                              className="mt-2 inline-block text-orange-600 hover:text-orange-700 text-sm"
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
      <Footer />
    </div>
  );
};

export default OwnerProductList;

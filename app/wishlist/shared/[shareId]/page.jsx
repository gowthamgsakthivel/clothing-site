'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Loading from '@/components/Loading';
import { useAppContext } from '@/context/AppContext';

const SharedWishlistPage = () => {
  const { shareId } = useParams();
  const { products } = useAppContext();
  const [wishlistData, setWishlistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharedProducts, setSharedProducts] = useState([]);

  useEffect(() => {
    fetchSharedWishlist();
  }, [shareId]);

  useEffect(() => {
    if (wishlistData && products.length > 0) {
      const filteredProducts = products.filter(product =>
        wishlistData.productIds.includes(product._id)
      );
      setSharedProducts(filteredProducts);
    }
  }, [wishlistData, products]);

  const fetchSharedWishlist = async () => {
    try {
      const response = await fetch(`/api/wishlist/share?shareId=${shareId}`);
      const data = await response.json();

      if (data.success) {
        setWishlistData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error fetching shared wishlist:', err);
      setError('Failed to load shared wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{error}</h2>
              <p className="text-gray-600 mb-6">
                This wishlist may have been removed or the link has expired.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Browse Products
              </a>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {wishlistData?.userName}'s Wishlist
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {sharedProducts.length} {sharedProducts.length === 1 ? 'product' : 'products'} • 
                      Viewed {wishlistData?.viewCount} {wishlistData?.viewCount === 1 ? 'time' : 'times'}
                    </p>
                  </div>
                </div>

                {wishlistData?.message && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">"{wishlistData.message}"</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Products Grid */}
              {sharedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {sharedProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-gray-600">No products found in this wishlist</p>
                </div>
              )}

              {/* CTA */}
              <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-2">Love these products?</h3>
                <p className="text-orange-50 mb-6">
                  Create your own wishlist and share with friends!
                </p>
                <a
                  href="/wishlist"
                  className="inline-block px-6 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition font-medium"
                >
                  Start Your Wishlist
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SharedWishlistPage;

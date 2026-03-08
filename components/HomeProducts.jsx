import React, { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import Loading from "./Loading";

const HomeProducts = () => {
  const { router, fetchProductData, products, loadingStates } = useAppContext();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const hasFetchedRef = useRef(false);

  const refreshProducts = useCallback(async () => {
    await fetchProductData(1, 10);
  }, [fetchProductData]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        await refreshProducts();
      }
    };

    loadProducts();
  }, [refreshProducts]);

  useEffect(() => {
    const handleFocus = () => {
      if (products.length === 0) {
        refreshProducts();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [products.length, refreshProducts]);

  useEffect(() => {
    if (products.length > 0) {
      setFeaturedProducts(products.slice(0, 10));
    } else {
      setFeaturedProducts([]);
    }
  }, [products]);

  // Get products either from our local state or directly from context
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 10);
  const isLoading = loadingStates.products && displayProducts.length === 0;

  return (
    <div className="flex flex-col items-center pt-8 md:pt-14 px-0">
      <p className="text-xl md:text-2xl lg:text-3xl font-medium text-left w-full px-4 md:px-0">Popular products</p>

      {isLoading ? (
        <div className="w-full py-12 flex justify-center">
          <Loading />
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="w-full py-12 text-center text-gray-500">
          <p>No products available yet.</p>
          <button
            type="button"
            onClick={refreshProducts}
            className="mt-4 px-5 py-2 border rounded text-gray-500/70 hover:bg-slate-50/90 transition text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mt-6 pb-8 md:pb-14 w-full">
          {displayProducts.map((product) => (
            <ProductCard key={product?.product?._id} product={product} />
          ))}
        </div>
      )}

      <button
        onClick={() => { router.push('/all-products') }}
        className="px-8 md:px-12 py-2 md:py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition text-sm md:text-base"
      >
        See more
      </button>
    </div>
  );
};

export default HomeProducts;

import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import Loading from "./Loading";

const HomeProducts = () => {
  const { router, fetchProductData, products, loadingStates } = useAppContext();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      // Only fetch 10 products for the homepage if no products are loaded
      if (products.length === 0) {
        await fetchProductData(1, 10);
      } else {
        // Just use the first 10 products from the context
        setFeaturedProducts(products.slice(0, 10));
      }
    };

    loadProducts();
  }, [fetchProductData, products]);

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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mt-6 pb-8 md:pb-14 w-full">
          {displayProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
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

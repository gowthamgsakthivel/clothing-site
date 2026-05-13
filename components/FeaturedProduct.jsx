"use client"
import React from "react";
import FeaturedProductCard from "./FeaturedProductCard";

const FeaturedProduct = ({ products = [] }) => {
  // Log the raw data to debug
  console.log('FeaturedProduct received:', products);

  // API returns flat summaries from getProductSummary
  // The API response has `image` (singular) but we need `images` (array)
  // Convert them back to bundle format for FeaturedProductCard
  // Filter out products with no images
  const items = (products && products.length)
    ? products
        .filter((p) => {
          // API returns 'image' (singular), not 'images' (array)
          const hasImage = p?.image || (p?.images && Array.isArray(p.images) && p.images.length > 0);
          if (!hasImage) {
            console.warn('Filtered out product with no image:', p?.name);
          }
          return hasImage;
        })
        .map((p) => ({
          product: {
            _id: p._id,
            name: p.name,
            description: p.description || '',
            // Handle both 'image' (from API) and 'images' (from other sources)
            images: p.images && Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
            slug: p.slug,
            offerPrice: p.offerPrice || 0,
            price: p.price || 0,
            stock: p.stock ?? 1,
            avgRating: p.avgRating || 0,
            ratingCount: p.ratingCount || 0
          },
          variants: [],
          inventoryByVariantId: {}
        }))
    : [];

  console.log('FeaturedProduct items to render:', items.length);

  // If no valid featured products, show a message in dev
  if (!items.length) {
    return process.env.NODE_ENV === 'development' ? (
      <div className="mt-8 text-center text-gray-500">
        <p>No featured products configured with images</p>
      </div>
    ) : null;
  }

  return (
    <div className="mt-8 md:mt-14">
      <div className="flex flex-col items-center gap-3 mb-8">
        <p className="text-2xl md:text-3xl font-medium">Featured Products</p>
        <div className="w-20 md:w-28 h-0.5 bg-orange-600 mt-1"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 pb-8 w-full">
        {items.map((bundle) => (
          <FeaturedProductCard key={bundle.product._id} product={bundle} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedProduct;

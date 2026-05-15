"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';

const FeaturedProductCard = ({ product }) => {
  const { router, favorites, addFavorite, removeFavorite, user } = useAppContext();
  
  // Use product data directly since it's already properly structured
  const productData = product?.product;
  const summary = {
    _id: productData?._id,
    name: productData?.name,
    description: productData?.description || '',
    images: productData?.images || [],
    offerPrice: productData?.offerPrice || 0,
    price: productData?.price || 0,
    stock: productData?.stock ?? 1,
    avgRating: productData?.avgRating || 0,
    ratingCount: productData?.ratingCount || 0
  };

  const isFavorite = favorites?.includes(summary?._id);

  // Don't render if no image
  if (!summary?.images?.[0]) {
    console.warn('FeaturedProductCard: No image for product', summary?.name);
    return null;
  }

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add favorites');
      setTimeout(() => router.push('/sign-in'), 1500);
      return;
    }

    if (isFavorite) {
      removeFavorite(summary._id);
      toast.success('Removed from favorites');
    } else {
      addFavorite(summary._id);
      toast.success('Added to favorites');
    }
  };

  return (
    <Link href={`/product/${summary._id}`} className="block">
      <div className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow group cursor-pointer">
        {/* Image Container */}
        <div className="relative w-full aspect-video overflow-hidden bg-gray-200">
          <Image
            src={summary.images[0]}
            alt={summary.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Featured Badge */}
          <div className="absolute top-2 left-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            ⭐ Featured
          </div>

          {/* Stock Badge */}
          {summary.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 bg-gradient-to-b from-white to-gray-50">
          {/* Title */}
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-2">
            {summary.name}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-lg font-bold text-orange-600">₹{summary.offerPrice || summary.price || 0}</p>
            {summary.price > summary.offerPrice && (
              <p className="text-sm text-gray-500 line-through">₹{summary.price}</p>
            )}
          </div>

          {/* Buy Now Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              router.push(`/product/${summary._id}`);
            }}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
          >
            {summary.stock === 0 ? 'Notify Me' : 'Buy Now'}
          </button>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              handleFavoriteClick(e);
            }}
            className="w-full mt-2 py-1.5 border border-gray-300 hover:border-orange-600 text-gray-700 hover:text-orange-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Heart
              size={16}
              className={isFavorite ? 'fill-orange-600 text-orange-600' : ''}
            />
            {isFavorite ? 'Favorited' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedProductCard;

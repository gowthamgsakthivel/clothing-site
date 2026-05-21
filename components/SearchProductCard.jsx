import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { assets } from '@/assets/assets';
import { getProductSummary } from '@/lib/v2ProductView';

const SearchProductCard = ({ product }) => {
  const { router, currency } = useAppContext();
  const summary = product && (product._id || product.name || product.images)
    ? (product.offerPrice !== undefined ? product : getProductSummary(product))
    : getProductSummary(product);

  const rating = Number(summary?.avgRating || 0);
  const ratingCount = Number(summary?.ratingCount || 0);
  const fullStars = Math.round(rating);

  return (
    <article
      onClick={() => {
        router.push(`/product/${summary._id}`);
        scrollTo(0, 0);
      }}
      className="group cursor-pointer rounded-3xl border border-gray-100 bg-white/90 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-50">
        {summary.images?.[0] ? (
          <Image
            src={summary.images[0]}
            alt={summary.name}
            width={800}
            height={900}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No Image</div>
        )}

        {summary.stock === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm font-medium text-white">
            Out of stock
          </div>
        ) : summary.stock !== undefined && summary.stock > 0 && summary.stock < 10 ? (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[11px] font-medium text-white shadow-sm">
            Only few left
          </span>
        ) : null}
      </div>

      <div className="px-1 pb-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{summary.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-gray-900">{summary.name}</h3>

        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Image
                key={index}
                src={index < fullStars ? assets.star_icon : assets.star_dull_icon}
                alt="star"
                className="h-3.5 w-3.5"
              />
            ))}
          </div>
          {ratingCount > 0 && (
            <span className="text-xs text-gray-500">{rating.toFixed(1)} ({ratingCount})</span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-gray-900">{currency}{summary.offerPrice}</span>
              {summary.mrpPrice && summary.mrpPrice > summary.offerPrice && (
                <span className="text-xs text-gray-400 line-through">{currency}{summary.mrpPrice}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Fast delivery</p>
          </div>

          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition group-hover:bg-orange-600 group-hover:text-white">
            View
          </span>
        </div>
      </div>
    </article>
  );
};

export default SearchProductCard;

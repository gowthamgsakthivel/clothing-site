"use client"

import React from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';

const formatPrice = (value) => new Intl.NumberFormat('en-IN').format(Number(value || 0));

export default function SearchResultItem({ product, onSelect }) {
  const image = product?.images?.[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product?.name || 'Product'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <Image src={assets.logo} alt="logo" width={28} height={28} className="opacity-40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{product?.name}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{product?.brand}</p>
        <p className="mt-1 text-sm font-semibold text-orange-600">₹{formatPrice(product?.offerPrice)}</p>
      </div>

      <div className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
        View
      </div>
    </button>
  );
}
"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import MobileSearchOverlay from './MobileSearchOverlay';

export default function SearchBar({ className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md ${className}`}
        aria-label="Open search"
      >
        <Image src={assets.search_icon} alt="search" width={18} height={18} />
        <span className="min-w-0 flex-1 truncate text-sm text-gray-400">Search products, brands or categories</span>
        <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          Search
        </span>
      </button>

      <MobileSearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
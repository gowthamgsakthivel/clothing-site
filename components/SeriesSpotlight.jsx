"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const SeriesSpotlight = ({ products = [] }) => {
  const { addToCart } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);

  // Responsive itemsToShow: 1 on small, 2 on md, 3 on lg+
  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) setItemsToShow(1);
      else if (w < 1024) setItemsToShow(2);
      else setItemsToShow(3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const items = (products && products.length)
    ? products.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description || "",
        image: p.image || (p.images && Array.isArray(p.images) ? p.images[0] : ""),
        slug: p.slug,
        offerPrice: p.offerPrice || 0,
        price: p.price || 0,
        stock: p.stock ?? 1,
      }))
    : [];

  const maxIndex = Math.max(0, items.length - itemsToShow);

  // Ensure currentIndex stays in bounds when itemsToShow or items change
  React.useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(0);
  }, [itemsToShow, maxIndex, currentIndex]);

  if (!items.length) {
    return process.env.NODE_ENV === "development" ? (
      <div className="mt-8 text-center text-gray-500">
        <p>No products for Series Spotlight</p>
      </div>
    ) : null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : Math.max(0, prev - itemsToShow)));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : Math.min(maxIndex, prev + itemsToShow)));
  };

  const handleQuickBuy = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId) {
      toast.error("Product unavailable");
      return;
    }
    addToCart(productId);
    toast.success("Added to cart");
  };

  const showNav = items.length > itemsToShow;
  const visibleProducts = items.slice(currentIndex, currentIndex + itemsToShow);

  return (
    <section className="py-12 md:py-20">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">FEATURED COLLECTIONS</h2>
        <div className="w-16 h-1 bg-orange-600 mb-6"></div>
        <p className="text-gray-600 text-sm md:text-base max-w-2xl leading-relaxed">
          Discover our handpicked selection of premium sports apparel and equipment. 
          Premium quality products designed for athletes and sports enthusiasts.
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {showNav && (
          <div className="absolute -top-12 right-0 z-10 flex items-center gap-2 rounded-full bg-white/80 backdrop-blur border border-slate-200/80 shadow-md px-1.5 py-1">
            <button
              onClick={handlePrev}
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 border border-slate-200/80 shadow-sm transition-transform duration-200 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
              aria-label="Previous"
            >
              <ChevronLeft size={20} className="text-slate-700" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 border border-slate-200/80 shadow-sm transition-transform duration-200 hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
              aria-label="Next"
            >
              <ChevronRight size={20} className="text-slate-700" />
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product, idx) => {
            return (
              <Link
                key={product._id}
                href={`/product/${product._id}`}
                className="group"
              >
                <div className="flex flex-col h-full">
                  {/* Product Image */}
                  <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">No Image</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price and Button */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="text-lg md:text-xl font-bold text-orange-600">
                        ₹{product.offerPrice || product.price}
                      </div>
                      <button
                        onClick={(e) => handleQuickBuy(e, product._id)}
                        className="bg-gray-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-orange-600 transition-colors"
                      >
                        Quick Buy
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SeriesSpotlight;

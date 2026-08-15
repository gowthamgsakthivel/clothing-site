"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

const ShopByCategory = () => {
  const categories = [
    {
      id: 1,
      name: "Men's Wear",
      tag: "⚡ High Performance",
      slug: "men",
      query: "?gender=Men",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop&q=80",
      description: "Jerseys, Shorts & Tees"
    },
    {
      id: 2,
      name: "Women's Wear",
      tag: "🔥 Trending",
      slug: "women",
      query: "?gender=Women",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=1000&fit=crop&q=80",
      description: "Activewear & Tops"
    },
    {
      id: 3,
      name: "Junior & Kids",
      tag: "⭐ All Stars",
      slug: "kids",
      query: "?gender=Kids",
      image: "https://images.unsplash.com/photo-1503584623341-d0a7df51c8a1?w=800&h=1000&fit=crop&q=80",
      description: "Youth Sports Gear"
    },
    {
      id: 4,
      name: "All Collections",
      tag: "🏆 100+ Styles",
      slug: "all-products",
      query: "",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1000&fit=crop&q=80",
      description: "Explore Full Catalog"
    }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            Curated Collections
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/all-products"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 transition group"
        >
          <span>View all products</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
        {categories.map((category) => {
          const href = `/all-products${category.query}`;
          
          return (
            <Link
              key={category.id}
              href={href}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-200/60 shadow-md hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1.5"
            >
              {/* Background Image Container */}
              <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                
                {/* Layered Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-85 group-hover:opacity-75 transition-opacity duration-300" />
              </div>

              {/* Tag Badge */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                <span className="inline-block bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {category.tag}
                </span>
              </div>

              {/* Card Bottom Content */}
              <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 flex flex-col justify-end text-white z-10">
                <h3 className="text-base sm:text-xl md:text-2xl font-black text-white leading-tight group-hover:text-orange-400 transition-colors">
                  {category.name}
                </h3>
                
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-1 line-clamp-1">
                  {category.description}
                </p>

                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/15">
                  <span className="text-[10px] sm:text-xs font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
                    Explore Now
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ShopByCategory;

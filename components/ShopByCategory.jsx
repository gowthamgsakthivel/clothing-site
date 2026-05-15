"use client";

import React from "react";
import Link from "next/link";

const ShopByCategory = () => {
  const categories = [
    {
      id: 1,
      name: "Men",
      slug: "men",
      query: "?gender=Men",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
      description: "Explore Collection"
    },
    {
      id: 2,
      name: "Women",
      slug: "women",
      query: "?gender=Women",
      image: "https://images.unsplash.com/photo-1552821206-ffd41001db5f?w=600&h=600&fit=crop",
      description: "Explore Collection"
    },
    {
      id: 3,
      name: "Kids",
      slug: "kids",
      query: "?gender=Kids",
      image: "https://images.unsplash.com/photo-1503584623341-d0a7df51c8a1?w=600&h=600&fit=crop",
      description: "Explore Collection"
    },
    {
      id: 4,
      name: "All Products",
      slug: "all-products",
      query: "",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop",
      description: "Explore Collection"
    }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">SHOP BY CATEGORY</h2>
        <div className="w-16 h-1 bg-orange-600"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => {
          const href = `/all-products${category.query}`;
          
          return (
            <Link
              key={category.id}
              href={href}
              className="relative group overflow-hidden rounded-lg"
            >
              <div className="relative h-96 overflow-hidden bg-gray-900">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">{category.name}</h3>
                <div className="text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-2 group/link">
                  <span>{category.description}</span>
                  <svg
                    className="w-5 h-5 group-hover/link:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
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

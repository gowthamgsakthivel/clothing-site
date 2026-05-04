import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const FeaturedProduct = ({ products = [] }) => {
  const display = (products && products.length) ? products : [];

  // Fallback to sample assets if empty
  const fallback = [
    { id: 'f1', name: 'Default Product 1', description: '', imgSrc: assets.girl_with_headphone_image },
    { id: 'f2', name: 'Default Product 2', description: '', imgSrc: assets.girl_with_earphone_image },
    { id: 'f3', name: 'Default Product 3', description: '', imgSrc: assets.boy_with_laptop_image }
  ];

  const items = display.length ? display : fallback;

  return (
    <div className="mt-8 md:mt-14">
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl md:text-3xl font-medium">Featured Products</p>
        <div className="w-20 md:w-28 h-0.5 bg-orange-600 mt-1"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-8 md:mt-12 px-4 sm:px-0">
        {items.map((p) => (
          <div key={p.id} className="relative group">
            {p.imgSrc ? (
              <Image src={p.imgSrc} alt={p.name} className="group-hover:brightness-75 transition duration-300 w-full h-auto object-cover" />
            ) : (
              <img src={p.image || assets.redirect_icon} alt={p.name} className="group-hover:brightness-75 transition duration-300 w-full h-auto object-cover" />
            )}
            <div className="group-hover:-translate-y-4 transition duration-300 absolute bottom-8 left-8 text-white space-y-2">
              <p className="font-medium text-xl lg:text-2xl">{p.name}</p>
              <p className="text-sm lg:text-base leading-5 max-w-60">{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProduct;

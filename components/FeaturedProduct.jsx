import React from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";

const products = [
  {
    id: 1,
    image: assets.girl_with_headphone_image,
    title: "Pure Cotton Comfort",
    description: "Soft, breathable, and made for all-day wear",
  },
  {
    id: 2,
    image: assets.girl_with_earphone_image,
    title: "Stay Stylish, Stay Ahead",
    description: "Trending designs that keep your look fresh",
  },
  {
    id: 3,
    image: assets.boy_with_laptop_image,
    title: "Effortless Formal Elegance",
    description: "Smart, sharp, and perfect for every occasion",
  },
];

const FeaturedProduct = () => {
  return (
    <div className="mt-8 md:mt-14">
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl md:text-3xl font-medium">Featured Products</p>
        <div className="w-20 md:w-28 h-0.5 bg-orange-600 mt-1"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 lg:gap-14 mt-8 md:mt-12 px-4 sm:px-0">
        {products.map(({ id, image, title, description }) => (
          <div key={id} className="relative group">
            <Image
              src={image}
              alt={title}
              className="group-hover:brightness-75 transition duration-300 w-full h-auto object-cover"
            />
            <div className="group-hover:-translate-y-4 transition duration-300 absolute bottom-8 left-8 text-white space-y-2">
              <p className="font-medium text-xl lg:text-2xl">{title}</p>
              <p className="text-sm lg:text-base leading-5 max-w-60">
                {description}
              </p>
              {/* <button className="flex items-center gap-1.5 bg-orange-600 px-4 py-2 rounded">
                Buy now <Image className="h-3 w-3" src={assets.redirect_icon} alt="Redirect Icon" />
              </button> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProduct;

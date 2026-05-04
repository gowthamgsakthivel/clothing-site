'use client';
import React from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { useAppContext } from "@/context/AppContext";

const Banner = ({ banners = [] }) => {
  const { router } = useAppContext();

  const active = (banners || []).filter(b => b && b.active).sort((a, b) => (a.order || 0) - (b.order || 0));
  const first = active[0] || null;

  if (!first?.image) {
    return (
      <div className="my-16 rounded-xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-slate-500">
        No homepage banner is configured yet.
      </div>
    );
  }

  const RenderImage = ({ src, alt, className }) => (
    <img src={src} alt={alt} className={className} />
  );

  const title = first?.title || 'Design Your Custom Sportswear';
  const link = first?.link || '/custom-design';

  return (
    <div className="flex flex-col md:flex-row items-center justify-between md:pl-20 py-14 md:py-0 bg-[#E6E9F2] my-16 rounded-xl overflow-hidden">
      <a href={link} className="block">
        <RenderImage className="max-w-72" src={first.image} alt="banner_left" />
      </a>
      <div className="flex flex-col items-center justify-center text-center space-y-4 px-4 md:px-0">
        <h2 className="text-2xl md:text-3xl font-semibold max-w-[290px]">{title}</h2>
        <p className="max-w-[343px] font-medium text-gray-800/60">Upload your design, get quotes, and make it yours!</p>
        <button onClick={() => router.push('/custom-design')} className="group flex items-center justify-center gap-1 px-12 py-2.5 bg-orange-600 rounded text-white hover:bg-orange-700">
          Design Now
          <Image className="group-hover:translate-x-1 transition" src={assets.arrow_icon_white} alt="arrow_icon_white" />
        </button>
      </div>
    </div>
  );
};

export default Banner;
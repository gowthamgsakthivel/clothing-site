'use client';
import React from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { Sparkles, ArrowRight, Palette, ShieldCheck, Zap } from "lucide-react";

const Banner = ({ banners = [] }) => {
  const { router } = useAppContext();

  const active = (banners || []).filter(b => b && b.active).sort((a, b) => (a.order || 0) - (b.order || 0));
  const first = active[0] || null;

  const title = first?.title || 'Create Your Custom Team Jersey';
  const description = first?.description || 'Upload your club logo, pick colors, customize numbers & get instant bulk quotes!';
  const link = first?.link || '/custom-design';
  const imageUrl = first?.image || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=900&h=700&fit=crop&q=80";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-50/90 via-amber-50/50 to-stone-50 border border-orange-100/90 text-slate-900 my-8 sm:my-12 md:my-14 shadow-sm">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between p-5 sm:p-8 md:p-12 gap-6 sm:gap-8">
        {/* Left Text Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100/90 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Palette className="w-3.5 h-3.5 text-orange-600" />
            Custom Sportswear Studio
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            {title}
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-2.5 leading-relaxed">
            {description}
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-5 w-full max-w-md text-left">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
              <Zap className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Sublimation Printing</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Zero Minimum Order</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(link)}
            className="group flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-full text-white font-extrabold text-sm sm:text-base hover:from-orange-500 hover:to-amber-400 transition-all duration-300 shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <span>Start Designing Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right Hero Image Card */}
        <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 shadow-md">
          <Image
            src={imageUrl}
            alt="Custom Jersey Design Showcase"
            fill
            sizes="(min-width: 1024px) 450px, 90vw"
            className="object-cover hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/80 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Athletic Pro Grade Fabric</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
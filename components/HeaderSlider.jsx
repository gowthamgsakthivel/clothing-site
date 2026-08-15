'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DEFAULT_CAROUSEL_CONTROLS } from "@/lib/carouselDefaults";
import { Sparkles, ArrowRight, Zap, ChevronLeft, ChevronRight } from "lucide-react";

const HeaderSlider = ({ slides = [] }) => {
  const router = useRouter();
  const sliderData = slides.length ? slides : DEFAULT_CAROUSEL_CONTROLS.home;

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [sliderData.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderData.length) % sliderData.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderData.length);
  };

  return (
    <div className="overflow-hidden relative w-full pt-2 sm:pt-4">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{
          transform: `translateX(-${currentSlide * 100}%)`,
        }}
      >
        {sliderData.map((slide, index) => (
          <div
            key={slide.id || index}
            className="relative flex flex-col-reverse md:flex-row items-center justify-between bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-slate-50 border border-orange-100/80 py-6 sm:py-8 md:py-10 px-5 sm:px-8 md:px-12 rounded-3xl min-w-full gap-4 sm:gap-6 md:gap-8 shadow-sm overflow-hidden"
          >
            {/* Ambient Background Accents */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 md:pl-2 w-full md:w-3/5 text-center md:text-left flex flex-col items-center md:items-start">
              {/* Badge & Offer Tag */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 sm:mb-2.5">
                {slide.badge && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs">
                    {slide.badge}
                  </span>
                )}
                {slide.offer && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/90 border border-orange-200 text-orange-800 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-orange-600 fill-orange-600" />
                    {slide.offer}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight max-w-xl">
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-2 max-w-lg font-medium leading-relaxed">
                {slide.subtitle || "Ultra-breathable 4-way stretch fabric crafted for peak endurance and tournament performance."}
              </p>

              {/* Athletic Feature Highlights Pills */}
              {Array.isArray(slide.highlights) && slide.highlights.length > 0 && (
                <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                  {slide.highlights.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2.5 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-700 text-[11px] font-bold shadow-2xs"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 mt-4 sm:mt-6 w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-full text-white font-extrabold text-sm sm:text-base hover:from-orange-500 hover:to-amber-400 transition-all duration-300 shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
                  onClick={() => router.push(slide.link1 || '/all-products')}
                >
                  <span>{slide.buttonText1 || "Shop Sportswear"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => router.push(slide.link2 || '/custom-design')}
                >
                  <span>{slide.buttonText2 || "Custom Jersey"}</span>
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </button>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-center w-full md:w-2/5 aspect-square max-h-48 sm:max-h-60 md:max-h-76">
              {slide.imgSrc ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.08)] mix-blend-multiply transition-transform duration-500 hover:scale-105"
                    src={slide.imgSrc}
                    alt={slide.title || "Sparrow Sports Gear"}
                    fill
                    sizes="(min-width: 768px) 40vw, 80vw"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              ) : (
                <div className="w-40 h-40 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 text-sm font-semibold">
                  <span>Sparrow Sports</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="flex items-center gap-1.5">
          {sliderData.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSlideChange(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                currentSlide === index
                  ? "bg-orange-600 w-8"
                  : "bg-slate-300 w-2 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderSlider;

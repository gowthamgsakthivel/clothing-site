'use client';

import React from 'react';
import Image from 'next/image';

const LogoPreloader = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  showText = true,
  blurBackdrop = false,
  className = ''
}) => {
  // Dimensions based on size prop
  const sizeMap = {
    xs: { width: 42, height: 14, ring: 'w-10 h-10', textSize: 'text-[10px]', stroke: '2', showSubtext: false },
    sm: { width: 90, height: 30, ring: 'w-20 h-20', textSize: 'text-xs', stroke: '3', showSubtext: false },
    md: { width: 140, height: 48, ring: 'w-28 h-28', textSize: 'text-sm', stroke: '4', showSubtext: true },
    lg: { width: 200, height: 68, ring: 'w-40 h-40', textSize: 'text-base', stroke: '4', showSubtext: true },
    fullscreen: { width: 210, height: 72, ring: 'w-44 h-44', textSize: 'text-sm', stroke: '4', showSubtext: true }
  };

  const currentSize = sizeMap[fullScreen ? 'fullscreen' : size] || sizeMap.md;
  const isMicro = size === 'xs';

  const content = (
    <div className={`flex flex-col items-center justify-center ${isMicro ? 'p-1' : 'p-4'} text-center select-none ${className}`}>
      
      {/* Central Animated Logo Container */}
      <div className="relative flex items-center justify-center">
        
        {/* Ambient Glow Aura */}
        {!isMicro && (
          <div className="absolute w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-gradient-to-tr from-red-500/20 via-orange-400/20 to-indigo-600/20 blur-2xl animate-pulse pointer-events-none" />
        )}

        {/* Athletic Gradient Spinner Track */}
        <div className={`relative ${currentSize.ring} flex items-center justify-center shrink-0`}>
          <svg className="w-full h-full animate-spin -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-200/70 stroke-current"
              strokeWidth={currentSize.stroke}
              fill="none"
            />
            {/* Animated Active Arc */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="url(#sparrow-preloader-gradient)"
              strokeWidth={Number(currentSize.stroke) + 1}
              strokeDasharray="276"
              strokeDashoffset="190"
              strokeLinecap="round"
              fill="none"
            />
            <defs>
              <linearGradient id="sparrow-preloader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E51B24" />
                <stop offset="50%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#0B1238" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Sparrow Logo */}
          <div className="absolute inset-0 flex items-center justify-center p-1.5 sm:p-2">
            <div className="relative animate-pulse transition-transform duration-500 transform hover:scale-105">
              <Image
                src="/logo.svg"
                alt="Sparrow Sports"
                width={currentSize.width}
                height={currentSize.height}
                priority
                className="object-contain drop-shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Text & Bouncing Athletic Dots */}
      {showText && !isMicro && (
        <div className="mt-3 space-y-1">
          <p className={`${currentSize.textSize} font-extrabold uppercase tracking-widest text-slate-800 flex items-center justify-center gap-1.5`}>
            <span>{text}</span>
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-bounce" />
            </span>
          </p>
          {currentSize.showSubtext && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sparrow Sports Performance
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white/90 ${
          blurBackdrop ? 'backdrop-blur-md' : 'backdrop-blur-xs'
        } transition-opacity duration-300`}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center w-full ${isMicro ? 'min-h-[40px]' : 'min-h-[160px]'}`}>
      {content}
    </div>
  );
};

export default LogoPreloader;

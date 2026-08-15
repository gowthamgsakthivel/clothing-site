'use client';

import React from 'react';
import LogoPreloader from './LogoPreloader';

const LoadingOverlay = ({ isLoading, children, fullPage = false, message = 'Loading...' }) => {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div
        className={`inset-0 bg-white/85 backdrop-blur-xs flex items-center justify-center z-50 transition-all duration-300 ${
          fullPage ? 'fixed' : 'absolute'
        }`}
      >
        <LogoPreloader
          size={fullPage ? 'lg' : 'sm'}
          text={message}
          showText={true}
        />
      </div>
    </div>
  );
};

export default LoadingOverlay;
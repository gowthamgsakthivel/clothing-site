'use client';

import React from 'react';
import LogoPreloader from './LogoPreloader';

const Loading = ({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  showText = true,
  className = ''
}) => {
  return (
    <div
      className={`flex justify-center items-center ${
        fullScreen
          ? 'fixed inset-0 z-50 bg-white/90 backdrop-blur-xs'
          : 'w-full py-6'
      } ${className}`}
    >
      <LogoPreloader
        size={size}
        text={text}
        showText={showText}
        fullScreen={false}
      />
    </div>
  );
};

export default Loading;
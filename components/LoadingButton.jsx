'use client';

import React from 'react';

const LoadingButton = ({
  isLoading,
  onClick,
  children,
  className = '',
  loadingText = 'Loading...',
  type = 'button',
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`relative inline-flex items-center justify-center transition-all ${
        isLoading || disabled ? 'cursor-not-allowed opacity-80' : ''
      } ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          {/* Animated gradient micro spinner */}
          <svg className="w-5 h-5 animate-spin -rotate-90 shrink-0" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="9"
              className="opacity-25"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <path
              className="opacity-95"
              fill="currentColor"
              d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3z"
            />
          </svg>
          {loadingText && (
            <span className="text-xs font-bold tracking-wider uppercase">
              {loadingText}
            </span>
          )}
        </span>
      )}
      <span className={isLoading ? 'invisible' : 'inline-flex items-center gap-1.5'}>
        {children}
      </span>
    </button>
  );
};

export default LoadingButton;
import React from 'react';

const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-orange-600 text-white hover:bg-orange-700',
  secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
};

const sizes = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs'
};

const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) => {
  const classes = [baseClasses, variants[variant] || variants.primary, sizes[size] || sizes.md, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;

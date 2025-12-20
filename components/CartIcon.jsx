"use client";
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import { assets } from '@/assets/assets';

const CartCounter = () => {
    const { getCartCount, router, user } = useAppContext();
    const cartCount = getCartCount();

    const handleClick = () => {
        router.push('/cart');
    };

    return (
        <div onClick={handleClick} className="relative cursor-pointer">
            <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Image
                    src={assets.cart_icon}
                    alt="Cart"
                    width={20}
                    height={20}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                />
            </div>

            {cartCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                </div>
            )}

            {/* Tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {cartCount === 0 ? 'Cart is empty' : `${cartCount} item${cartCount !== 1 ? 's' : ''} in cart`}
            </div>
        </div>
    );
};

export default CartCounter;
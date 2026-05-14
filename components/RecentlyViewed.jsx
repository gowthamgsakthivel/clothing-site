'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import ProductCard from './ProductCard';

const RecentlyViewed = ({ currentProductId = null, maxItems = 10 }) => {
    const { products } = useAppContext();
    const [recentProducts, setRecentProducts] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    // Detect if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const loadRecentlyViewed = useCallback(() => {
        try {
            const stored = localStorage.getItem('recentlyViewed');
            if (!stored || !Array.isArray(products) || products.length === 0) {
                return;
            }

            const productIds = JSON.parse(stored);
            const itemsToShow = isMobile ? 6 : 5;

            // Filter out current product and map to actual product objects
            const recentProductsList = productIds
                .filter(id => id !== currentProductId)
                .map(id => products.find(p => p?.product?._id === id))
                .filter(p => p !== undefined)
                .slice(0, itemsToShow);

            setRecentProducts(recentProductsList);
        } catch (error) {
            console.error('Error loading recently viewed:', error);
        }
    }, [currentProductId, maxItems, products, isMobile]);

    useEffect(() => {
        loadRecentlyViewed();
    }, [loadRecentlyViewed]);

    if (recentProducts.length === 0) {
        return null;
    }

    return (
        <div className="w-full py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Recently Viewed
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Continue where you left off
                    </p>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('recentlyViewed');
                        setRecentProducts([]);
                    }}
                    className="text-sm text-gray-600 hover:text-orange-600 transition"
                >
                    Clear History
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recentProducts.map((product) => (
                    <ProductCard key={product?.product?._id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;

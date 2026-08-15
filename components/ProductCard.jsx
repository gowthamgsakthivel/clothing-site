import React from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import { getProductSummary } from '@/lib/v2ProductView';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

const ProductCard = ({ product, priority = false }) => {
    const { currency, router, favorites, addFavorite, removeFavorite, user } = useAppContext();
    
    // Support both full bundle objects and precomputed summary objects
    const summary = (product && (product.offerPrice !== undefined || product.images !== undefined || product.name))
        ? product
        : getProductSummary(product);
        
    const isFavorite = favorites?.includes(summary?._id);
    const ratingValue = summary?.avgRating || 0;
    const ratingCount = summary?.ratingCount || 0;
    const filledStars = Math.round(ratingValue);

    const originalPrice = summary?.price || 0;
    const offerPrice = summary?.offerPrice || 0;
    const hasDiscount = originalPrice > offerPrice && offerPrice > 0;
    const discountPercent = hasDiscount
        ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
        : 0;

    const isOutOfStock = summary.stock !== undefined && summary.stock === 0;
    const isLowStock = summary.stock !== undefined && summary.stock > 0 && summary.stock < 10;

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        if (!user) {
            toast.error('Please sign in to add favorites');
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

        if (isFavorite) {
            removeFavorite(summary._id);
            toast.success('Removed from wishlist');
        } else {
            addFavorite(summary._id);
            toast.success('Added to wishlist');
        }
    };

    return (
        <div
            onClick={() => { router.push('/product/' + summary._id); scrollTo(0, 0); }}
            className="flex flex-col items-start w-full cursor-pointer group/card bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3 border border-slate-100 hover:border-slate-200/80 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1"
        >
            {/* Image Box */}
            <div className="relative bg-slate-50/90 rounded-xl sm:rounded-2xl w-full aspect-[4/5] flex items-center justify-center overflow-hidden transition-all duration-500 border border-slate-100/80">
                {/* Stock Badges / Discount Badges */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                    {hasDiscount && (
                        <span className="bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-[9px] sm:text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
                            {discountPercent}% OFF
                        </span>
                    )}
                    {isLowStock && (
                        <span className="bg-rose-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                            Only {summary.stock} left
                        </span>
                    )}
                </div>

                {isOutOfStock && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs z-10 p-2 text-center">
                        <span className="text-white font-extrabold text-xs sm:text-sm tracking-wide">Out of Stock</span>
                        <span className="text-slate-200 text-[10px] mt-0.5">Tap to get notified</span>
                    </div>
                )}

                {summary.images?.[0] ? (
                    <Image
                        src={summary.images[0]}
                        alt={summary.name}
                        className="transition-transform duration-700 ease-out group-hover/card:scale-105 object-contain p-2 w-full h-full mix-blend-multiply"
                        width={400}
                        height={400}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        priority={priority}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs font-semibold">
                        <span>No Image</span>
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-xs p-2 rounded-full shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white active:scale-90"
                    onClick={handleFavoriteClick}
                    aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <Heart
                        size={15}
                        className={`transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
                    />
                </button>
            </div>

            {/* Product Meta */}
            <div className="w-full pt-2.5 px-0.5 flex flex-col flex-1 justify-between">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover/card:text-orange-600 transition-colors">
                        {summary.name}
                    </h3>
                    
                    {summary.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {summary.description}
                        </p>
                    )}
                </div>

                {/* Rating */}
                {ratingCount > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/80">
                            <span className="text-[11px] font-bold text-amber-800">{ratingValue.toFixed(1)}</span>
                            <span className="text-amber-500 text-[10px]">★</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">({ratingCount})</span>
                    </div>
                )}

                {/* Price & Action Row */}
                <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100/80">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm sm:text-base font-black text-slate-900">
                                {currency}{offerPrice}
                            </span>
                            {hasDiscount && (
                                <span className="text-[11px] text-slate-400 line-through font-semibold">
                                    {currency}{originalPrice}
                                </span>
                            )}
                        </div>
                    </div>

                    {isOutOfStock ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!user) {
                                    toast.error('Please sign in to get notified');
                                    setTimeout(() => router.push('/sign-in'), 1500);
                                    return;
                                }
                                router.push(`/product/${summary._id}?notify=true`);
                            }}
                            className="px-3 py-1 text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] sm:text-[11px] font-bold hover:bg-indigo-100 transition-all active:scale-95 shrink-0"
                        >
                            Notify
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/product/${summary._id}`);
                            }}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 group-hover/card:bg-orange-600 text-white rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 shadow-sm active:scale-95 shrink-0"
                        >
                            <span>Buy</span>
                            <ArrowRight className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
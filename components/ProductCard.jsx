import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import { getProductSummary } from '@/lib/v2ProductView';

const ProductCard = ({ product }) => {
    const { currency, router, favorites, addFavorite, removeFavorite, user } = useAppContext();
    const summary = getProductSummary(product);
    const isFavorite = favorites?.includes(summary?._id);

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        if (!user) {
            toast.error('Please sign in to add favorites');
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

        if (isFavorite) {
            removeFavorite(summary._id);
            toast.success('Removed from favorites');
        } else {
            addFavorite(summary._id);
            toast.success('Added to favorites');
        }
    };

    return (
        <div
            onClick={() => { router.push('/product/' + summary._id); scrollTo(0, 0) }}
            className="flex flex-col items-start gap-1 w-full cursor-pointer group/card"
        >
            <div className="cursor-pointer relative bg-gray-50/80 rounded-2xl w-full aspect-[4/5] flex items-center justify-center overflow-hidden transition-all duration-500 ease-out border border-gray-100/60 group-hover/card:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-hover/card:-translate-y-1">
                {/* Handle various stock states */}
                {summary.stock === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 rounded-lg">
                        <p className="text-white font-medium mb-2">Out of Stock</p>
                    </div>
                ) : summary.stock !== undefined && summary.stock > 0 && summary.stock < 10 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">Only few left</span>
                )}
                {summary.images?.[0] ? (
                    <Image
                        src={summary.images[0]}
                        alt={summary.name}
                        className="transition-transform duration-700 ease-out group-hover/card:scale-110 object-cover w-full h-full"
                        width={800}
                        height={800}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <span>No Image</span>
                    </div>
                )}
                <button
                    className={`absolute top-3 right-3 bg-white/90 backdrop-blur p-2.5 rounded-full shadow-sm opacity-0 group-hover/card:opacity-100 md:opacity-100 transition-all duration-300 hover:scale-110 ${isFavorite ? 'text-orange-600' : ''}`}
                    onClick={handleFavoriteClick}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Image
                        className="h-3.5 w-3.5"
                        src={assets.heart_icon}
                        alt="heart_icon"
                        style={{ filter: isFavorite ? 'invert(32%) sepia(98%) saturate(749%) hue-rotate(359deg) brightness(97%) contrast(101%)' : 'none' }}
                    />
                </button>
            </div>

            <p className="text-sm md:text-base font-semibold text-gray-900 pt-3 w-full truncate">{summary.name}</p>
            <p className="w-full text-[13px] text-gray-500 md:block hidden truncate">{summary.description}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs">{4.5}</p>
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Image
                            key={index}
                            className="h-3 w-3"
                            src={
                                index < Math.floor(4)
                                    ? assets.star_icon
                                    : assets.star_dull_icon
                            }
                            alt="star_icon"
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between w-full mt-2">
                <p className="text-base font-bold text-gray-900">{currency}{summary.offerPrice}</p>
                {summary.stock !== undefined && summary.stock === 0 ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                                toast.error('Please sign in to get notified');
                                setTimeout(() => router.push('/sign-in'), 1500);
                                return;
                            }
                            // Show notification modal or navigate to notification page
                            router.push(`/product/${summary._id}?notify=true`);
                            toast.success('Select your preferred options');
                        }}
                        className="px-4 py-2 text-blue-600 bg-blue-50/50 border border-blue-200 rounded-full text-[13px] font-medium hover:bg-blue-100 hover:border-blue-300 transition-all active:scale-95"
                    >
                        Notify Me
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/product/${summary._id}`);
                        }}
                        className="px-5 py-2 text-gray-700 bg-white border border-gray-200 rounded-full text-[13px] font-medium hover:bg-black hover:text-white hover:border-black transition-all duration-300 active:scale-95 shadow-sm"
                    >
                        Buy now
                    </button>
                )}
            </div>
        </div>
    )
}

export default ProductCard
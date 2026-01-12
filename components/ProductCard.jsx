import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
    const { currency, router, favorites, addFavorite, removeFavorite, user } = useAppContext();
    const isFavorite = favorites?.includes(product._id);

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        if (!user) {
            toast.error('Please sign in to add favorites');
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

        if (isFavorite) {
            removeFavorite(product._id);
            toast.success('Removed from favorites');
        } else {
            addFavorite(product._id);
            toast.success('Added to favorites');
        }
    };

    return (
        <div
            onClick={() => { router.push('/product/' + product._id); scrollTo(0, 0) }}
            className="flex flex-col items-start gap-0.5 w-full cursor-pointer"
        >
            <div className="cursor-pointer group relative bg-gray-500/10 rounded-lg w-full h-52 flex items-center justify-center">
                {/* Handle various stock states */}
                {product.stock === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 rounded-lg">
                        <p className="text-white font-medium mb-2">Out of Stock</p>
                    </div>
                ) : product.stock !== undefined && product.stock > 0 && product.stock < 10 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">Only few left</span>
                )}
                {product.image?.[0] ? (
                    <Image
                        src={product.image[0]}
                        alt={product.name}
                        className="group-hover:scale-105 transition object-cover w-4/5 h-4/5 md:w-full md:h-full"
                        width={800}
                        height={800}
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <span>No Image</span>
                    </div>
                )}
                <button
                    className={`absolute top-2 right-2 bg-white p-2 rounded-full shadow-md ${isFavorite ? 'text-orange-600' : ''}`}
                    onClick={handleFavoriteClick}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Image
                        className="h-3 w-3"
                        src={assets.heart_icon}
                        alt="heart_icon"
                        style={{ filter: isFavorite ? 'invert(32%) sepia(98%) saturate(749%) hue-rotate(359deg) brightness(97%) contrast(101%)' : 'none' }}
                    />
                </button>
            </div>

            <p className="text-sm md:text-base font-medium pt-2 w-full truncate">{product.name}</p>
            <p className="w-full text-xs text-gray-500/70 md:block hidden truncate">{product.description}</p>
            <div className="flex items-center gap-2">
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

            <div className="flex items-end justify-between w-full mt-1">
                <p className="text-base font-medium">{currency}{product.offerPrice}</p>
                {product.stock !== undefined && product.stock === 0 ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                                toast.error('Please sign in to get notified');
                                setTimeout(() => router.push('/sign-in'), 1500);
                                return;
                            }
                            // Show notification modal or navigate to notification page
                            router.push(`/product/${product._id}?notify=true`);
                            toast.success('Select your preferred options');
                        }}
                        className="px-4 py-1.5 text-blue-600 border border-blue-500/50 rounded-full text-xs hover:bg-blue-50 transition"
                    >
                        Notify Me
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/product/${product._id}`);
                        }}
                        className="px-4 py-1.5 text-gray-500 border border-gray-500/20 rounded-full text-xs hover:bg-slate-50 transition"
                    >
                        Buy now
                    </button>
                )}
            </div>
        </div>
    )
}

export default ProductCard
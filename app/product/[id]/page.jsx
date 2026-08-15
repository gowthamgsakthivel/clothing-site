"use client"
import { useEffect, useState, useCallback } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import SEOMetadata from "@/components/SEOMetadata";
import ProductReviews from "@/components/ProductReviews";
import RecentlyViewed from "@/components/RecentlyViewed";
import { addToRecentlyViewed } from "@/lib/recentlyViewed";
import SizeGuideModal from "@/components/SizeGuideModal";
import SizeRecommendation from "@/components/SizeRecommendation";
import { getSizeChart } from "@/lib/sizeGuideData";
import { buildColorSizeMatrix, getAvailableSizes as getVariantSizes, getPriceSummary, getProductImages } from "@/lib/v2ProductView";
import ShareButton from "@/components/ShareButton";
import React from "react";
import toast from "react-hot-toast";

const normalizeProductData = (payload) => {
    if (!payload) return null;

    if (payload.product) {
        const product = payload.product || {};
        const variants = payload.variants || [];
        const inventoryByVariantId = payload.inventoryByVariantId || {};
        const priceSummary = getPriceSummary(variants);
        const images = Array.isArray(product.image)
            ? product.image
            : Array.isArray(product.images)
                ? product.images
                : getProductImages(variants);

        return {
            ...product,
            image: images,
            offerPrice: Number.isFinite(product.offerPrice) ? product.offerPrice : priceSummary.offerPrice,
            price: Number.isFinite(product.price) ? product.price : priceSummary.price,
            inventory: buildColorSizeMatrix(variants, inventoryByVariantId),
            sizes: getVariantSizes(variants),
        };
    }

    const priceSummary = getPriceSummary(payload.variants || []);

    return {
        ...payload,
        image: Array.isArray(payload.image)
            ? payload.image
            : Array.isArray(payload.images)
                ? payload.images
                : [],
        offerPrice: Number.isFinite(payload.offerPrice) ? payload.offerPrice : priceSummary.offerPrice,
        price: Number.isFinite(payload.price) ? payload.price : priceSummary.price,
    };
};

const Product = () => {

    const { id } = useParams();

    const { products, router, addToCart, user, getToken, favorites, addFavorite, removeFavorite } = useAppContext();

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const [notifySuccess, setNotifySuccess] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [showSizeRecommendation, setShowSizeRecommendation] = useState(false);
    const [sizeChart, setSizeChart] = useState(null);

    const fetchProductData = useCallback(async () => {
        // Safely find product and handle if products array is undefined
        if (Array.isArray(products)) {
            const product = products.find(item => item?.product?._id === id || item?._id === id);
            if (product) {
                setProductData(normalizeProductData(product));

                // Reset color and size selection when product changes
                setSelectedColor(null);
                setSelectedSize(null);

                // Set default color if available - use a temporary function to avoid dependency issues
                const getColorsFromProduct = (prod) => {
                    // Try new inventory format first
                    if (Array.isArray(prod.inventory) && prod.inventory.length > 0) {
                        return prod.inventory.map(item => ({
                            color: item.color.name,
                            stock: item.sizeStock.reduce((sum, sizeStock) => sum + (sizeStock.quantity || 0), 0),
                            _id: item._id || item.color.name
                        }));
                    }

                    // Fallback to old format
                    if (Array.isArray(prod.color)) {
                        return prod.color;
                    }

                    return [];
                };

                const availableColors = getColorsFromProduct(normalizeProductData(product));
                if (availableColors.length > 0) {
                    // Find first color that has stock
                    const inStockColor = availableColors.find(c => c.stock > 0);
                    if (inStockColor) {
                        setSelectedColor(inStockColor.color);
                    } else {
                        // If all colors are out of stock, just select the first one
                        setSelectedColor(availableColors[0].color);
                    }
                }
                return;
            }
        }

        try {
            const response = await fetch(`/api/product/details/${id}`);
            const data = await response.json();

            if (data.success && data.product) {
                setProductData(normalizeProductData(data.product));
                setSelectedColor(null);
                setSelectedSize(null);
            }
        } catch (error) {
            console.error('Failed to fetch product details', error);
        }
    }, [products, id]);

    useEffect(() => {
        fetchProductData();
        // Track product view
        if (id) {
            addToRecentlyViewed(id);
        }
    }, [id, fetchProductData]);

    useEffect(() => {
        if (productData) {
            const chart = getSizeChart(productData.category, productData.subCategory);
            setSizeChart(chart);
        }
    }, [productData]);

    // Check URL parameters for notify flag
    useEffect(() => {
        // Get search params from URL for App Router
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('notify') === 'true') {
                setIsNotifying(true);
            }
        }
    }, []);

    // Function to subscribe for stock notifications
    const subscribeToStockNotifications = async () => {
        if (!user) {
            toast.error("Please sign in to subscribe for notifications");
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

        if (!selectedColor) {
            toast.error("Please select a color first");
            return;
        }

        if (!selectedSize) {
            toast.error("Please select a size first");
            return;
        }

        try {
            setIsNotifying(true);

            // Show loading toast while processing
            const toastId = toast.loading("Subscribing to stock notification...");

            // Get the token for authentication
            const token = await getToken();

            const response = await fetch('/api/product/notify-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: id,
                    productName: productData.name,
                    color: selectedColor,
                    size: selectedSize,
                    image: productData.image && productData.image.length > 0 ? productData.image[0] : '',
                    price: productData.offerPrice
                })
            });

            const data = await response.json();

            if (data.success) {
                setNotifySuccess(true);
                toast.success("You'll be notified when this item is back in stock!", {
                    id: toastId,
                    duration: 4000,
                });

                // Reset after 3 seconds
                setTimeout(() => {
                    setIsNotifying(false);
                    setNotifySuccess(false);
                }, 3000);
            } else {
                console.error('Notification subscription failed:', data.message);
                toast.error(data.message || 'Something went wrong. Please try again.', {
                    id: toastId,
                    duration: 3000,
                });

                setIsNotifying(false);
                // Reset state after error
                setTimeout(() => {
                    setIsNotifying(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Error subscribing to stock notification:', error);
            toast.error('Failed to subscribe. Please try again later.');

            setIsNotifying(false);
            // Reset state after error
            setTimeout(() => {
                setIsNotifying(false);
            }, 3000);
        }
    };

    // Helper: get color object by value - handles both old and new inventory formats
    const getColorObj = (color) => {
        if (!productData) return null;

        // Try new inventory format first
        if (Array.isArray(productData.inventory) && productData.inventory.length > 0) {
            const inventoryItem = productData.inventory.find(item => item.color.name === color || item.color.code === color);
            if (inventoryItem) {
                // Calculate total stock for this color
                const totalStock = inventoryItem.sizeStock.reduce((sum, sizeStock) => sum + (sizeStock.quantity || 0), 0);
                return {
                    color: inventoryItem.color.name,
                    stock: totalStock,
                    _id: inventoryItem._id || inventoryItem.color.name
                };
            }
        }

        // Fallback to old format
        if (Array.isArray(productData.color)) {
            return productData.color.find(c => c.color === color);
        }

        return null;
    };

    // Helper: get available colors - handles both formats
    const getAvailableColors = () => {
        if (!productData) return [];

        // Try new inventory format first
        if (Array.isArray(productData.inventory) && productData.inventory.length > 0) {
            return productData.inventory.map(item => ({
                color: item.color.name,
                stock: item.sizeStock.reduce((sum, sizeStock) => sum + (sizeStock.quantity || 0), 0),
                _id: item._id || item.color.name
            }));
        }

        // Fallback to old format
        if (Array.isArray(productData.color)) {
            return productData.color;
        }

        return [];
    };

    // Helper: get available sizes - handles both formats
    const getAvailableSizes = () => {
        if (!productData) return [];

        // Try new inventory format first
        if (Array.isArray(productData.inventory) && productData.inventory.length > 0) {
            const allSizes = new Set();
            productData.inventory.forEach(item => {
                item.sizeStock.forEach(sizeStock => {
                    if (sizeStock.quantity > 0) {
                        allSizes.add(sizeStock.size);
                    }
                });
            });
            return Array.from(allSizes);
        }

        // Fallback to old format
        if (Array.isArray(productData.sizes)) {
            return productData.sizes;
        }

        return [];
    };

    // Helper: get specific color-size combination stock
    const getColorSizeStock = (color, size) => {
        if (!productData || !color || !size) return 0;

        // Try new inventory format first
        if (Array.isArray(productData.inventory) && productData.inventory.length > 0) {
            const inventoryItem = productData.inventory.find(item =>
                item.color.name === color || item.color.code === color
            );
            if (inventoryItem) {
                const sizeStock = inventoryItem.sizeStock.find(ss => ss.size === size);
                return sizeStock ? sizeStock.quantity || 0 : 0;
            }
        }

        // Fallback to old format (assumes all sizes available if color has stock)
        if (Array.isArray(productData.color)) {
            const colorObj = productData.color.find(c => c.color === color);
            if (colorObj && colorObj.stock > 0) {
                return Math.floor(colorObj.stock / (productData.sizes?.length || 1));
            }
        }

        return 0;
    };

    const isFavorite = favorites?.includes(productData?._id);

    const handleFavoriteClick = (event) => {
        event.stopPropagation();
        if (!user) {
            toast.error('Please sign in to add favorites');
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

        if (isFavorite) {
            removeFavorite(productData._id);
        } else {
            addFavorite(productData._id);
        }
    };

    return productData ? (<>
        <SEOMetadata
            title={`${productData.name} | ${productData.brand} | Sparrow Sports`}
            description={`${productData.description.slice(0, 150)}... - ${productData.brand} ${productData.category} at ₹${productData.offerPrice}`}
            keywords={`${productData.name}, ${productData.brand}, ${productData.category}, sports, athletic wear`}
            imageUrl={productData.image[0]}
            url={`/product/${id}`}
            product={{
                name: productData.name,
                description: productData.description,
                image: productData.image[0],
                brand: productData.brand,
                category: productData.category,
                _id: productData._id,
                sku: productData.sku || productData._id,
                offerPrice: productData.offerPrice,
                new_price: productData.offerPrice,
                price: productData.price,
                stock: (() => {
                    // Calculate total stock from new inventory format
                    if (Array.isArray(productData.inventory) && productData.inventory.length > 0) {
                        return productData.inventory.reduce((total, item) => {
                            return total + item.sizeStock.reduce((subtotal, sizeStock) => subtotal + (sizeStock.quantity || 0), 0);
                        }, 0);
                    }
                    // Fallback to old format
                    if (Array.isArray(productData.color) && productData.color.length > 0) {
                        return productData.color.reduce((total, color) => total + (color.stock || 0), 0);
                    }
                    return 10; // default fallback
                })(),
                ratings: productData.ratings || []
            }}
        />
        <Navbar />
        <div className="px-3 sm:px-6 md:px-16 lg:px-32 pt-[var(--nav-height)] md:pt-24 space-y-6 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-16">
                <div className="px-0 sm:px-2 lg:px-4 xl:px-6">
                    <div className="rounded-2xl md:rounded-lg overflow-hidden bg-gray-500/10 mb-4 relative aspect-[4/5] p-2.5 sm:p-4">
                        {/* Floating Back Button (Mobile) */}
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="absolute top-3 left-3 z-20 h-10 w-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center md:hidden backdrop-blur-xs hover:bg-white transition"
                            aria-label="Go back"
                        >
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Floating Wishlist Button */}
                        <button
                            type="button"
                            onClick={handleFavoriteClick}
                            className={`absolute top-3 right-3 z-20 h-10 w-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center backdrop-blur-xs hover:bg-white transition ${isFavorite ? 'text-orange-600' : 'text-gray-700'}`}
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <Image
                                className="h-4 w-4"
                                src={assets.heart_icon}
                                alt="heart_icon"
                                style={{ filter: isFavorite ? 'invert(32%) sepia(98%) saturate(749%) hue-rotate(359deg) brightness(97%) contrast(101%)' : 'none' }}
                            />
                        </button>
                        {/* Show badge only if selected color has less than 10 units */}
                        {selectedColor && getColorObj(selectedColor) && getColorObj(selectedColor).stock < 10 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
                                Only few left
                            </span>
                        )}
                        {(mainImage || productData.image?.[0]) ? (
                            <Image
                                src={mainImage || productData.image[0]}
                                alt="alt"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-contain mix-blend-multiply"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400">
                                No Image Available
                            </div>
                        )}
                        {productData.image.length > 1 && (
                            <div className="absolute bottom-3 left-3 right-3 z-10">
                                <div className="flex items-center justify-center gap-2">
                                    {productData.image.map((image, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setMainImage(image)}
                                            className={`h-12 w-12 rounded-lg overflow-hidden bg-white/90 shadow-sm border ${mainImage === image || (!mainImage && index === 0)
                                                ? 'border-orange-500'
                                                : 'border-transparent'
                                                }`}
                                            aria-label={`View image ${index + 1}`}
                                        >
                                            <Image
                                                src={image}
                                                alt="alt"
                                                className="object-cover w-full h-full"
                                                width={48}
                                                height={48}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col bg-white md:bg-transparent rounded-t-3xl md:rounded-none mt-4 md:mt-0 p-4 sm:p-6 md:p-0 shadow md:shadow-none relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                        <h1 className="text-2xl sm:text-3xl font-medium text-gray-800/90 flex-1">
                            {productData.name}
                        </h1>
                        <div className="hidden md:block">
                            <ShareButton
                                product={productData}
                                title={productData.name}
                                description={productData.description}
                                image={productData.image[0]}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" />
                            <Image
                                className="h-4 w-4"
                                src={assets.star_dull_icon}
                                alt="star_dull_icon"
                            />
                        </div>
                        <p className="text-sm">(4.5)</p>
                    </div>
                    <div className="mt-2 sm:mt-3">
                        <p className={`text-gray-600 text-sm sm:text-base ${showFullDescription ? '' : 'max-h-16 overflow-hidden'}`}>
                            {productData.description}
                        </p>
                        {productData.description && productData.description.length > 140 && (
                            <button
                                type="button"
                                onClick={() => setShowFullDescription((prev) => !prev)}
                                className="mt-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                            >
                                {showFullDescription ? 'Show Less' : 'Read More'}
                            </button>
                        )}
                    </div>
                    {/* Price & Savings Callout */}
                    <div className="mt-4 sm:mt-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl sm:text-4xl font-black text-slate-900">
                                ₹{productData.offerPrice}
                            </span>
                            {productData.price > productData.offerPrice && (
                                <>
                                    <span className="text-base sm:text-lg font-semibold text-slate-400 line-through">
                                        ₹{productData.price}
                                    </span>
                                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-1 rounded-full">
                                        Save ₹{productData.price - productData.offerPrice} ({Math.round(((productData.price - productData.offerPrice) / productData.price) * 100)}% OFF)
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">Inclusive of all taxes • Free Shipping available</p>
                    </div>

                    <hr className="border-slate-100 my-4 sm:my-6" />
                    <div className="space-y-5">
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand</p>
                            <p className="text-sm font-semibold text-slate-900">{productData.brand || "Sparrow Sports"}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Color</p>
                                {selectedColor && (
                                    <span className="text-xs font-bold text-orange-600">Selected: {selectedColor}</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const availableColors = getAvailableColors();
                                    return availableColors.length > 0 ? (
                                        availableColors.map((c, idx) => {
                                            const isDisabled = c.stock < 1;
                                            const isSelected = selectedColor === c.color;
                                            return (
                                                <button
                                                    key={c._id || idx}
                                                    type="button"
                                                    className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all focus:outline-none cursor-pointer ${isDisabled
                                                        ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border-slate-200'
                                                        : isSelected
                                                            ? 'border-orange-500 ring-2 ring-orange-400/50 bg-orange-50/50 text-orange-950 shadow-sm'
                                                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 active:scale-[0.98]'
                                                        }`}
                                                    onClick={() => {
                                                        if (!isDisabled) {
                                                            setSelectedColor(c.color);
                                                            setQuantity(1);
                                                        }
                                                    }}
                                                    aria-pressed={isSelected}
                                                    aria-label={`Select color ${c.color}`}
                                                    title={isDisabled ? 'Out of stock' : `${c.stock} in stock`}
                                                    disabled={isDisabled}
                                                >
                                                    <span
                                                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                                                        style={{ backgroundColor: c.color }}
                                                        aria-hidden="true"
                                                    />
                                                    <span>{c.color}</span>
                                                    {isDisabled && <span className="text-[10px] text-rose-500 font-bold">(Out)</span>}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <span className="text-sm text-slate-500">Standard</span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Size</p>
                                <button
                                    onClick={() => setShowSizeGuide(true)}
                                    className="text-xs text-orange-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Size Guide
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const availableSizes = getAvailableSizes();
                                    return availableSizes.length > 0 ? (
                                        availableSizes.map((size) => {
                                            const sizeStock = getColorSizeStock(selectedColor, size);
                                            const isOutOfStock = selectedColor && sizeStock <= 0;
                                            const isDisabled = !selectedColor || isOutOfStock;
                                            const isSelected = selectedSize === size;
                                            const isLowStock = selectedColor && sizeStock > 0 && sizeStock <= 3;

                                            return (
                                                <div key={size} className="flex flex-col items-start">
                                                    <button
                                                        type="button"
                                                        className={`min-h-[42px] min-w-[48px] px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-all focus:outline-none cursor-pointer ${isDisabled
                                                            ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border-slate-200'
                                                            : isSelected
                                                                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                                                                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 active:scale-[0.98]'
                                                            }`}
                                                        onClick={() => {
                                                            if (!isDisabled) {
                                                                setSelectedSize(size);
                                                                setQuantity(1);
                                                            }
                                                        }}
                                                        disabled={isDisabled}
                                                        aria-pressed={isSelected}
                                                    >
                                                        {size}
                                                        {isOutOfStock && <span className="ml-1 text-rose-400">✕</span>}
                                                    </button>
                                                    {isLowStock && (
                                                        <span className="mt-1 text-[9px] text-rose-600 font-extrabold">Only {sizeStock} left</span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <span className="text-sm text-slate-500">Free Size</span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</label>
                                {selectedColor && selectedSize && (
                                    <span className="text-xs text-slate-500 font-medium">
                                        {getColorSizeStock(selectedColor, selectedSize)} available
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 flex items-center justify-center active:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        disabled={quantity <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <div className="w-12 h-10 flex items-center justify-center border-x border-slate-200 bg-slate-50">
                                        <span className="text-sm font-bold text-slate-900">{quantity}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                            if (maxStock > 0 && quantity < maxStock) {
                                                setQuantity(quantity + 1);
                                            }
                                        }}
                                        className="w-10 h-10 flex items-center justify-center active:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        disabled={(() => {
                                            const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                            return !selectedColor || !selectedSize || quantity >= maxStock;
                                        })()}
                                        aria-label="Increase quantity"
                                    >
                                        <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Trust Perks */}
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2">
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl p-2 font-bold text-slate-800">
                                <span className="text-emerald-600">✓</span> 100% Genuine
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl p-2 font-bold text-slate-800">
                                <span className="text-blue-600">⚡</span> Fast Dispatch
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl p-2 font-bold text-slate-800">
                                <span className="text-amber-600">🔄</span> 7-Day Exchange
                            </div>
                        </div>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-8 sm:mt-10">
                        {(() => {
                            const colorSizeStock = getColorSizeStock(selectedColor, selectedSize);
                            const isOutOfStock = selectedColor && selectedSize && colorSizeStock <= 0;
                            const canAddToCart = selectedColor && selectedSize && !isOutOfStock;

                            if (isOutOfStock) {
                                return (
                                    <button
                                        onClick={subscribeToStockNotifications}
                                        className={`w-full py-4 rounded-full font-bold ${isNotifying ? 'bg-slate-200 cursor-wait' :
                                            notifySuccess ? 'bg-emerald-500 text-white' :
                                                'bg-indigo-600 text-white hover:bg-indigo-700'
                                            } transition shadow-md`}
                                        disabled={isNotifying || notifySuccess}
                                    >
                                        {isNotifying ? 'Processing...' :
                                            notifySuccess ? 'You will be notified!' :
                                                'Notify When In Stock'}
                                    </button>
                                );
                            }

                            return (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (canAddToCart) {
                                                addToCart(productData._id, { color: selectedColor, size: selectedSize, quantity });
                                            } else if (!selectedColor) {
                                                toast.error('Please select a color');
                                            } else if (!selectedSize) {
                                                toast.error('Please select a size');
                                            }
                                        }}
                                        className={`w-full sm:flex-1 py-4 rounded-full font-extrabold text-sm border-2 transition-all duration-300 cursor-pointer ${canAddToCart ?
                                            'border-slate-900 bg-white text-slate-900 hover:bg-slate-50 active:scale-95 shadow-xs' :
                                            'border-slate-200 bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        Add to Cart
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (canAddToCart) {
                                                addToCart(productData._id, { color: selectedColor, size: selectedSize, quantity });
                                                router.push('/cart');
                                            } else if (!selectedColor) {
                                                toast.error('Please select a color');
                                            } else if (!selectedSize) {
                                                toast.error('Please select a size');
                                            }
                                        }}
                                        className={`w-full sm:flex-1 py-4 rounded-full font-extrabold text-sm transition-all duration-300 cursor-pointer shadow-lg ${canAddToCart ?
                                            'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white hover:from-orange-500 hover:to-amber-400 active:scale-95 shadow-orange-500/25' :
                                            'bg-slate-300 text-slate-500'
                                            }`}
                                    >
                                        Buy Now
                                    </button>
                                </>
                            );
                        })()}
                    </div>

                    {/* Mobile Sticky Bottom Floating Action Bar */}
                    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex items-center justify-between gap-3 shadow-2xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Price</span>
                            <span className="text-lg font-black text-slate-900">₹{productData.offerPrice * quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedColor && selectedSize) {
                                        addToCart(productData._id, { color: selectedColor, size: selectedSize, quantity });
                                    } else {
                                        toast.error('Please choose color & size');
                                    }
                                }}
                                className="px-4 py-2.5 rounded-full border border-slate-900 bg-white text-slate-900 font-extrabold text-xs"
                            >
                                Add to Cart
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedColor && selectedSize) {
                                        addToCart(productData._id, { color: selectedColor, size: selectedSize, quantity });
                                        router.push('/cart');
                                    } else {
                                        toast.error('Please choose color & size');
                                    }
                                }}
                                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/20"
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="px-4 sm:px-6 md:px-16 lg:px-32 py-8 md:py-12">
                <ProductReviews productId={id} />
            </div>

            {/* Recently Viewed Products */}
            <div className="px-4 sm:px-6 md:px-16 lg:px-32 py-8 md:py-12">
                <RecentlyViewed currentProductId={id} />
            </div>

            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mb-4 mt-16">
                    <p className="text-3xl font-medium">Featured <span className="font-medium text-orange-600">Products</span></p>
                    <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
                    {products.slice(0, 5).map((product, index) => <ProductCard key={index} product={product} />)}
                </div>
                <button className="px-8 py-2 mb-16 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
                    See more
                </button>
            </div>
        </div>
        <Footer />

        {/* Size Guide Modal */}
        {sizeChart && (
            <SizeGuideModal
                isOpen={showSizeGuide}
                onClose={() => setShowSizeGuide(false)}
                sizeChart={sizeChart}
                productName={productData?.name}
                fitType={productData?.fitType || 'regular'}
            />
        )}
    </>
    ) : <Loading />
};

export default Product;
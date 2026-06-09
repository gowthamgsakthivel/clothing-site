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
import ShareButton from "@/components/ShareButton";
import React from "react";
import toast from "react-hot-toast";

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
            const product = products.find(product => product?._id === id);
            if (product) {
                setProductData(product);

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

                const availableColors = getColorsFromProduct(product);
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
            }
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
        <div className="px-4 sm:px-6 md:px-16 lg:px-32 pt-20 md:pt-24 space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-16">
                <div className="px-0 sm:px-2 lg:px-4 xl:px-6">
                    <div className="rounded-2xl md:rounded-lg overflow-hidden bg-gray-500/10 mb-4 relative aspect-[4/5]">
                        <button
                            type="button"
                            onClick={handleFavoriteClick}
                            className={`absolute top-3 right-3 z-20 h-10 w-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center ${isFavorite ? 'text-orange-600' : 'text-gray-700'}`}
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <Image
                                className="h-4 w-4"
                                src={assets.heart_icon}
                                alt="heart_icon"
                                style={{ filter: isFavorite ? 'invert(32%) sepia(98%) saturate(749%) hue-rotate(359deg) brightness(97%) contrast(101%)' : 'none' }}
                            />
                        </button>
                        <div className="absolute top-3 left-2 right-2 z-10 flex items-center justify-between md:hidden pointer-events-none">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="h-10 w-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center pointer-events-auto"
                                aria-label="Go back"
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
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
                    <div className="flex items-end gap-3 mt-4 sm:mt-6">
                        <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
                            ₹{productData.offerPrice}
                        </p>
                        <span className="text-xs sm:text-base font-normal text-gray-500 line-through">
                            ₹{productData.price}
                        </span>
                    </div>
                    <hr className="bg-gray-200 my-4 sm:my-6" />
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-700">Brand</p>
                            <p className="text-sm text-gray-800/80">{productData.brand}</p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-700">Color</p>
                                {selectedColor && (
                                    <span className="text-[11px] text-gray-500">Selected: {selectedColor}</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
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
                                                    className={`min-h-[40px] px-2.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 transition focus:outline-none ${isDisabled
                                                        ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed border-gray-200'
                                                        : isSelected
                                                            ? 'border-orange-500 ring-2 ring-orange-300 bg-white'
                                                            : 'border-gray-300 bg-white active:scale-[0.98]'
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
                                                        className="w-3.5 h-3.5 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: c.color }}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="whitespace-nowrap">{c.color}</span>
                                                    {isDisabled && <span className="text-xs">(Out)</span>}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <span className="text-sm text-gray-500">No colors available</span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-700">Size</p>
                                <button
                                    onClick={() => setShowSizeGuide(true)}
                                    className="text-[11px] text-orange-600 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Size Guide
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                {(() => {
                                    const availableSizes = getAvailableSizes();
                                    return availableSizes.includes('L') ? 'Most customers buy L' : 'True to size';
                                })()}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {(() => {
                                    const availableSizes = getAvailableSizes();
                                    return availableSizes.length > 0 ? (
                                        availableSizes.map((size) => {
                                            const sizeStock = getColorSizeStock(selectedColor, size);
                                            const isOutOfStock = selectedColor && sizeStock <= 0;
                                            const isDisabled = !selectedColor || isOutOfStock;
                                            const isSelected = selectedSize === size;
                                            const isLowStock = selectedColor && sizeStock > 0 && sizeStock <= 2;

                                            return (
                                                <div key={size} className="flex flex-col items-start">
                                                    <button
                                                        type="button"
                                                        className={`min-h-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold transition focus:outline-none ${isDisabled
                                                            ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed border-gray-200'
                                                            : isSelected
                                                                ? 'bg-orange-500 text-white border-orange-500'
                                                                : 'bg-white text-gray-700 border-gray-300 active:scale-[0.98]'
                                                            }`}
                                                        onClick={() => {
                                                            if (!isDisabled) {
                                                                setSelectedSize(size);
                                                                setQuantity(1);
                                                            }
                                                        }}
                                                        disabled={isDisabled}
                                                        aria-pressed={isSelected}
                                                        title={isOutOfStock ? `${size} is out of stock in ${selectedColor}` :
                                                            selectedColor ? `${sizeStock} ${size} available in ${selectedColor}` :
                                                                'Please select a color first'}
                                                    >
                                                        {size}
                                                        {isOutOfStock && <span className="ml-1 text-red-400">✕</span>}
                                                    </button>
                                                    {isLowStock && (
                                                        <span className="mt-1 text-[10px] text-red-600 font-medium">Only {sizeStock} left</span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <span className="text-sm text-gray-500">No sizes available</span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-700">Category</p>
                            <p className="text-sm text-gray-800/80">{productData.category}</p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-gray-700">Quantity</label>
                                {selectedColor && selectedSize && (
                                    <span className="text-[11px] text-gray-500 font-medium">
                                        {getColorSizeStock(selectedColor, selectedSize)} available
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 flex items-center justify-center active:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        disabled={quantity <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <div className="w-12 h-10 flex items-center justify-center border-x border-gray-300 bg-gray-50">
                                        <span className="text-sm font-semibold text-gray-900">{quantity}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                            if (maxStock > 0 && quantity < maxStock) {
                                                setQuantity(quantity + 1);
                                            }
                                        }}
                                        className="w-10 h-10 flex items-center justify-center active:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        disabled={(() => {
                                            const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                            return !selectedColor || !selectedSize || quantity >= maxStock;
                                        })()}
                                        aria-label="Increase quantity"
                                    >
                                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                                {selectedColor && selectedSize && quantity > 0 && (
                                    <div className="flex flex-col gap-1 text-[11px]">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium w-fit">
                                            {quantity} {quantity === 1 ? 'item' : 'items'}
                                        </span>
                                        {(() => {
                                            const remaining = getColorSizeStock(selectedColor, selectedSize) - quantity;
                                            if (remaining > 0 && remaining < 10) {
                                                if (remaining <= 2) {
                                                    return (
                                                        <span className="text-red-600 font-medium">Only {remaining} left</span>
                                                    );
                                                }
                                                return <span className="text-gray-500">{remaining} left</span>;
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-gray-600">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Factory stitched
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Direct from manufacturer
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Quality checked
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-4 mt-8 sm:mt-10">
                        {/* Check if selected color-size combination is out of stock */}
                        {(() => {
                            const colorSizeStock = getColorSizeStock(selectedColor, selectedSize);
                            const isOutOfStock = selectedColor && selectedSize && colorSizeStock <= 0;
                            const canAddToCart = selectedColor && selectedSize && !isOutOfStock;

                            if (isOutOfStock) {
                                return (
                                    <button
                                        onClick={subscribeToStockNotifications}
                                        className={`w-full py-3.5 ${isNotifying ? 'bg-gray-200 cursor-wait' :
                                            notifySuccess ? 'bg-green-500 text-white' :
                                                'bg-blue-500 text-white hover:bg-blue-600'
                                            } transition`}
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
                                        onClick={() => {
                                            if (canAddToCart) {
                                                // Add items with specified quantity
                                                addToCart(productData._id, { color: selectedColor, size: selectedSize, quantity });
                                            }
                                        }}
                                        className={`w-full py-3.5 ${canAddToCart ?
                                            'bg-gray-100 text-gray-800/80 hover:bg-gray-200' :
                                            'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            } transition`}
                                        disabled={!canAddToCart}
                                    >
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (canAddToCart) {
                                                // Add items with specified quantity
                                                addToCart(productData._id, { color: selectedColor, size: selectedSize, quantity });
                                                router.push('/cart');
                                            }
                                        }}
                                        className={`w-full py-3.5 ${canAddToCart ?
                                            'bg-orange-500 text-white hover:bg-orange-600' :
                                            'bg-orange-200 text-gray-400 cursor-not-allowed'
                                            } transition`}
                                        disabled={!canAddToCart}
                                    >
                                        Buy now
                                    </button>
                                </>
                            );
                        })()}
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
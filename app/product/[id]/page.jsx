"use client"
import { useEffect, useState, useCallback, useMemo } from "react";
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
import axios from "axios";
import {
    buildColorSizeMatrix,
    findVariantForSelection,
    getProductSummary,
    getVisibleVariants
} from "@/lib/v2ProductView";

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
    const [showStickyBar, setShowStickyBar] = useState(false);

    // Scroll listener for sticky bar
    useEffect(() => {
        const handleScroll = () => {
            // Show sticky bar after scrolling down past the main image/details (approx 600px)
            if (window.scrollY > 600) {
                setShowStickyBar(true);
            } else {
                setShowStickyBar(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchProductData = useCallback(async () => {
        let product = null;

        if (Array.isArray(products)) {
            product = products.find(existing => existing?.product?._id === id) || null;
        }

        if (!product && id) {
            try {
                const { data } = await axios.get(`/api/product/details/${id}`);
                if (data.success) {
                    product = data.product;
                }
            } catch (error) {
                console.error('Failed to fetch product details:', error);
            }
        }

        if (product) {
            setProductData(product);

            // Reset color and size selection when product changes
            setSelectedColor(null);
            setSelectedSize(null);

            // Set default color if available - use a temporary function to avoid dependency issues
            const summary = getProductSummary(product);
            const availableColors = (summary.inventory || []).map((item) => ({
                color: item.color.name,
                stock: item.stock,
                _id: item.color.name
            }));
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
    }, [products, id]);

    useEffect(() => {
        fetchProductData();
        // Track product view
        if (id) {
            addToRecentlyViewed(id);
        }
    }, [id, fetchProductData]);

    useEffect(() => {
        if (productData?.product) {
            const chart = getSizeChart(productData.product.category, productData.product.subCategory);
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
                    productName: productDoc?.name,
                    color: selectedColor,
                    size: selectedSize,
                    image: summary?.images?.[0] || '',
                    price: summary?.offerPrice || 0
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
    const productDoc = productData?.product || null;
    const visibleVariants = useMemo(
        () => getVisibleVariants(productData?.variants || []),
        [productData]
    );
    const summary = useMemo(
        () => (productData ? getProductSummary(productData) : null),
        [productData]
    );
    const colorMatrix = useMemo(
        () => buildColorSizeMatrix(visibleVariants, productData?.inventoryByVariantId || {}),
        [visibleVariants, productData]
    );
    const selectedVariant = useMemo(
        () => findVariantForSelection(visibleVariants, selectedColor, selectedSize),
        [visibleVariants, selectedColor, selectedSize]
    );

    const getColorObj = (color) => {
        if (!colorMatrix.length) return null;
        const inventoryItem = colorMatrix.find(item => item.color.name === color || item.color.code === color);
        if (!inventoryItem) return null;
        return {
            color: inventoryItem.color.name,
            stock: inventoryItem.stock,
            _id: inventoryItem.color.name
        };
    };

    // Helper: get available colors - handles both formats
    const getAvailableColors = () => {
        if (!colorMatrix.length) return [];
        return colorMatrix.map(item => ({
            color: item.color.name,
            stock: item.stock,
            _id: item.color.name
        }));
    };

    // Helper: get available sizes - handles both formats
    const getAvailableSizes = () => {
        if (!colorMatrix.length) return [];

        if (selectedColor) {
            const inventoryItem = colorMatrix.find(item => item.color.name === selectedColor || item.color.code === selectedColor);
            if (!inventoryItem) return [];
            return inventoryItem.sizeStock
                .filter((sizeStock) => sizeStock.quantity > 0)
                .map((sizeStock) => sizeStock.size);
        }

        const allSizes = new Set();
        colorMatrix.forEach((item) => {
            item.sizeStock.forEach((sizeStock) => {
                if (sizeStock.quantity > 0) {
                    allSizes.add(sizeStock.size);
                }
            });
        });

        return Array.from(allSizes);
    };

    // Helper: get specific color-size combination stock
    const getColorSizeStock = (color, size) => {
        if (!color || !size) return 0;
        const inventoryItem = colorMatrix.find(item => item.color.name === color || item.color.code === color);
        if (!inventoryItem) return 0;
        const sizeStock = inventoryItem.sizeStock.find(ss => ss.size === size);
        return sizeStock ? sizeStock.quantity || 0 : 0;
    };

    const isFavorite = favorites?.includes(productDoc?._id);

    const handleFavoriteClick = (event) => {
        event.stopPropagation();
        if (!user) {
            toast.error('Please sign in to add favorites');
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

        if (isFavorite) {
            removeFavorite(productDoc._id);
        } else {
            addFavorite(productDoc._id);
        }
    };

    return productData && summary ? (<>
        <SEOMetadata
            title={`${productDoc.name} | ${productDoc.brand} | Sparrow Sports`}
            description={`${productDoc.description.slice(0, 150)}... - ${productDoc.brand} ${productDoc.category} at ₹${summary.offerPrice}`}
            keywords={`${productDoc.name}, ${productDoc.brand}, ${productDoc.category}, sports, athletic wear`}
            imageUrl={summary.images[0]}
            url={`/product/${id}`}
            product={{
                name: productDoc.name,
                description: productDoc.description,
                image: summary.images[0],
                brand: productDoc.brand,
                category: productDoc.category,
                _id: productDoc._id,
                sku: selectedVariant?.sku || productDoc._id,
                offerPrice: summary.offerPrice,
                new_price: summary.offerPrice,
                price: summary.price,
                stock: summary.stock,
                ratings: productDoc.ratings || []
            }}
        />
        <Navbar />
        <div className="md:px-16 lg:px-32 pt-[60px] md:pt-24 space-y-8 md:space-y-10 pb-24 md:pb-0">
            {/* Main Product Layout - Sticky Desktop, Stacked Mobile */}
            <div className="flex flex-col md:flex-row gap-0 md:gap-12 lg:gap-16 relative items-start">
                {/* Left Column: Images (Scrolls normally on desktop) */}
                <div className="w-full md:w-1/2 lg:w-[55%]">
                    {/* Main Image Container - Edge-to-Edge on Mobile */}
                    <div className="bg-gray-100 md:rounded-2xl overflow-hidden relative w-full aspect-[4/5] sm:aspect-square md:aspect-[4/5] lg:aspect-[3/4]">
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
                        {(mainImage || summary.images?.[0]) ? (
                            <Image
                                src={mainImage || summary.images[0]}
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
                        {summary.images.length > 1 && (
                            <div className="absolute bottom-3 left-3 right-3 z-10">
                                <div className="flex items-center justify-center gap-2">
                                    {summary.images.map((image, index) => (
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

                {/* Right Column: Sticky Details */}
                <div className="w-full md:w-1/2 lg:w-[45%] md:sticky md:top-24 flex flex-col bg-white pt-6 md:pt-0 px-4 sm:px-6 md:px-0">
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                                {productDoc.name}
                            </h1>
                            <div className="hidden md:block">
                                <ShareButton
                                    product={productDoc}
                                    title={productDoc.name}
                                    description={productDoc.description}
                                    image={summary.images[0]}
                                />
                            </div>
                        </div>

                        {/* Price and Ratings block */}
                        <div className="flex flex-wrap items-end justify-between mt-2">
                            <div className="flex items-end gap-3">
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    ₹{selectedVariant?.offerPrice || summary.offerPrice}
                                </p>
                                <span className="text-sm font-medium text-gray-400 line-through mb-1">
                                    ₹{selectedVariant?.originalPrice || summary.price}
                                </span>
                                {(selectedVariant?.originalPrice || summary.price) > (selectedVariant?.offerPrice || summary.offerPrice) && (
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded mb-1 border border-green-100">
                                        {Math.round((((selectedVariant?.originalPrice || summary.price) - (selectedVariant?.offerPrice || summary.offerPrice)) / (selectedVariant?.originalPrice || summary.price)) * 100)}% OFF
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5">
                                    <Image className="h-3.5 w-3.5" src={assets.star_icon} alt="star" />
                                    <Image className="h-3.5 w-3.5" src={assets.star_icon} alt="star" />
                                    <Image className="h-3.5 w-3.5" src={assets.star_icon} alt="star" />
                                    <Image className="h-3.5 w-3.5" src={assets.star_icon} alt="star" />
                                    <Image className="h-3.5 w-3.5 opacity-40" src={assets.star_dull_icon} alt="star" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 underline">(4.5)</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className={`text-gray-600 text-sm leading-relaxed ${showFullDescription ? '' : 'line-clamp-3'}`}>
                            {productDoc.description}
                        </p>
                        {productDoc.description && productDoc.description.length > 140 && (
                            <button
                                type="button"
                                onClick={() => setShowFullDescription((prev) => !prev)}
                                className="mt-1 text-sm font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                            >
                                {showFullDescription ? 'Read Less' : 'Read More'}
                            </button>
                        )}
                    </div>

                    <hr className="bg-gray-100 my-6" />

                    <div className="space-y-6">
                        {/* Tags / Meta */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            <span className="bg-gray-50 text-gray-600 text-[11px] font-bold px-3 py-1 rounded border border-gray-200 uppercase tracking-wider">
                                {productDoc.brand}
                            </span>
                            <span className="bg-gray-50 text-gray-600 text-[11px] font-bold px-3 py-1 rounded border border-gray-200 uppercase tracking-wider">
                                {productDoc.category}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1">
                                <p className="text-sm font-bold text-gray-900">Color</p>
                                {selectedColor && (
                                    <span className="text-xs font-medium text-gray-500">Selected: <span className="text-gray-900">{selectedColor}</span></span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2.5">
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
                                                    className={`group w-9 h-9 rounded-full relative flex items-center justify-center transition-all duration-300 focus:outline-none ${isDisabled
                                                        ? 'opacity-30 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'ring-2 ring-orange-500 ring-offset-2 scale-110'
                                                            : 'hover:scale-110 hover:ring-2 hover:ring-gray-300 hover:ring-offset-1 shadow-sm border border-gray-200'
                                                        }`}
                                                    onClick={() => {
                                                        if (!isDisabled) {
                                                            setSelectedColor(c.color);
                                                            setQuantity(1);
                                                        }
                                                    }}
                                                    aria-pressed={isSelected}
                                                    aria-label={`Select color ${c.color}`}
                                                    title={isDisabled ? `Out of stock (${c.color})` : `${c.color} - ${c.stock} in stock`}
                                                    disabled={isDisabled}
                                                >
                                                    <span
                                                        className="w-full h-full rounded-full"
                                                        style={{
                                                            backgroundColor: c.color.startsWith('#') ? c.color : c.color.toLowerCase(),
                                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                        aria-hidden="true"
                                                    />
                                                    {isDisabled && (
                                                        <span className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-full h-[2px] bg-red-500 rotate-45 rounded" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <span className="text-sm text-gray-500">No colors available</span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1">
                                <p className="text-sm font-bold text-gray-900">Size</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-[11px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded">
                                        {(() => {
                                            const availableSizes = getAvailableSizes();
                                            return availableSizes.includes('L') ? 'Runs true to size' : 'True fit';
                                        })()}
                                    </p>
                                    <button
                                        onClick={() => setShowSizeGuide(true)}
                                        className="text-[11px] text-orange-600 font-bold flex items-center gap-1 hover:text-orange-700 underline underline-offset-2"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Size Guide
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
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
                                                <div key={size} className="flex flex-col items-center w-full">
                                                    <button
                                                        type="button"
                                                        className={`w-full min-h-[44px] rounded-lg border text-sm font-bold transition-all focus:outline-none ${isDisabled
                                                            ? 'bg-gray-50 text-gray-300 opacity-60 cursor-not-allowed border-gray-100'
                                                            : isSelected
                                                                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900 active:scale-[0.97]'
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
                                                    </button>
                                                    {isLowStock && (
                                                        <span className="mt-1 text-[10px] text-red-600 font-bold tracking-tight">Only {sizeStock} left</span>
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
                            <p className="text-sm text-gray-800/80">{productDoc.category}</p>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between pb-1">
                                <label className="text-sm font-bold text-gray-900">Quantity</label>
                                {selectedColor && selectedSize && (
                                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                        {getColorSizeStock(selectedColor, selectedSize)} in stock
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm h-12">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-full flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        disabled={quantity <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <div className="w-12 h-full flex items-center justify-center border-x border-gray-200 bg-gray-50/50">
                                        <span className="text-base font-semibold text-gray-900">{quantity}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                            if (maxStock > 0 && quantity < maxStock) {
                                                setQuantity(quantity + 1);
                                            }
                                        }}
                                        className="w-12 h-full flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        disabled={(() => {
                                            const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                            return !selectedColor || !selectedSize || quantity >= maxStock;
                                        })()}
                                        aria-label="Increase quantity"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                            <div className="flex flex-col items-center justify-center gap-1.5 p-2 bg-gray-50 rounded text-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-600 tracking-tight leading-none">Premium<br />Quality</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1.5 p-2 bg-gray-50 rounded text-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-600 tracking-tight leading-none">Direct<br />Mfg</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1.5 p-2 bg-gray-50 rounded text-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="text-[10px] sm:text-xs font-semibold text-gray-600 tracking-tight leading-none">Secure<br />Pay</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-8">
                        {/* Check if selected color-size combination is out of stock */}
                        {(() => {
                            const colorSizeStock = getColorSizeStock(selectedColor, selectedSize);
                            const isOutOfStock = selectedColor && selectedSize && colorSizeStock <= 0;
                            const canAddToCart = selectedColor && selectedSize && !isOutOfStock;

                            if (isOutOfStock) {
                                return (
                                    <button
                                        onClick={subscribeToStockNotifications}
                                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-sm ${isNotifying ? 'bg-gray-200 text-gray-500 cursor-wait' :
                                            notifySuccess ? 'bg-green-600 text-white shadow-green-600/30' :
                                                'bg-gray-900 text-white hover:bg-black hover:shadow-gray-900/30 active:scale-[0.98]'
                                            }`}
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
                                                addToCart(productDoc._id, { color: selectedColor, size: selectedSize, quantity });
                                            }
                                        }}
                                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${canAddToCart ?
                                            'bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 shadow-sm active:scale-[0.98]' :
                                            'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'
                                            }`}
                                        disabled={!canAddToCart}
                                    >
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (canAddToCart) {
                                                // Add items with specified quantity
                                                addToCart(productDoc._id, { color: selectedColor, size: selectedSize, quantity });
                                                router.push('/cart');
                                            }
                                        }}
                                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${canAddToCart ?
                                            'bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-700 hover:shadow-orange-700/40 active:scale-[0.98]' :
                                            'bg-orange-200 text-white cursor-not-allowed hidden md:block'
                                            }`}
                                        disabled={!canAddToCart}
                                    >
                                        Buy Now
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
                    {products.slice(0, 5).map((product, index) => (
                        <ProductCard key={product?.product?._id || index} product={product} />
                    ))}
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
                productName={productDoc?.name}
                fitType={productDoc?.fitType || 'regular'}
            />
        )}

        {/* Sticky Add to Cart Bar */}
        <div
            className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] p-3 md:p-4 z-50 transition-transform duration-300 ease-in-out flex items-center justify-between md:justify-center md:gap-12 lg:hidden ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
        >
            <div className="flex items-center gap-3">
                {summary.images?.[0] && (
                    <div className="w-10 h-10 rounded bg-gray-100 hidden sm:block relative overflow-hidden">
                        <Image src={summary.images[0]} alt="thumb" fill className="object-cover mix-blend-multiply" />
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[120px] sm:max-w-xs">{productDoc.name}</span>
                    <span className="text-sm font-bold text-orange-600">₹{selectedVariant?.offerPrice || summary.offerPrice}</span>
                </div>
            </div>

            <button
                onClick={() => {
                    const colorSizeStock = getColorSizeStock(selectedColor, selectedSize);
                    const isOutOfStock = selectedColor && selectedSize && colorSizeStock <= 0;
                    const canAddToCart = selectedColor && selectedSize && !isOutOfStock;

                    if (!selectedColor || !selectedSize) {
                        toast.error("Please select Size and Color first");
                        // Scroll back up to selection
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                        return;
                    }

                    if (canAddToCart) {
                        addToCart(productDoc._id, { color: selectedColor, size: selectedSize, quantity });
                        toast.success("Added to cart");
                    } else if (isOutOfStock) {
                        subscribeToStockNotifications();
                    }
                }}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${(!selectedColor || !selectedSize) ? 'bg-orange-500 text-white shadow-sm hover:bg-orange-600' : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-700 active:scale-95'}`}
            >
                Add to Cart
            </button>
        </div>

    </>
    ) : <Loading />
};

export default Product;
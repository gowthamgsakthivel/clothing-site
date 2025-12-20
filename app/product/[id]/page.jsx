"use client"
import { useEffect, useState } from "react";
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

    const { products, router, addToCart, user, getToken } = useAppContext();

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isNotifying, setIsNotifying] = useState(false);
    const [notifySuccess, setNotifySuccess] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [showSizeRecommendation, setShowSizeRecommendation] = useState(false);
    const [sizeChart, setSizeChart] = useState(null);

    const fetchProductData = async () => {
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
    }

    useEffect(() => {
        fetchProductData();
        // Track product view
        if (id) {
            addToRecentlyViewed(id);
        }
        // Load size chart based on product category
        if (productData) {
            const chart = getSizeChart(productData.category, productData.subCategory);
            setSizeChart(chart);
        }
    }, [id, products, productData?.category, productData?.subCategory]);

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
        <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="px-5 lg:px-16 xl:px-20">
                    <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4 relative">
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
                                className="w-full h-auto object-cover mix-blend-multiply"
                                width={1280}
                                height={720}
                            />
                        ) : (
                            <div className="w-full h-96 flex items-center justify-center bg-gray-200 text-gray-400">
                                No Image Available
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {productData.image.map((image, index) => (
                            <div
                                key={index}
                                onClick={() => setMainImage(image)}
                                className="cursor-pointer rounded-lg overflow-hidden bg-gray-500/10"
                            >
                                <div className="w-24 h-24 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                    <Image
                                        src={image}
                                        alt="alt"
                                        className="object-cover w-full h-full"
                                        width={96}
                                        height={96}
                                    />
                                </div>
                            </div>

                        ))}
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className="text-3xl font-medium text-gray-800/90 flex-1">
                            {productData.name}
                        </h1>
                        <ShareButton 
                            product={productData}
                            title={productData.name}
                            description={productData.description}
                            image={productData.image[0]}
                        />
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
                        <p>(4.5)</p>
                    </div>
                    <p className="text-gray-600 mt-3">
                        {productData.description}
                    </p>
                    <p className="text-3xl font-medium mt-6">
                        ₹{productData.offerPrice}
                        <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                            ₹{productData.price}
                        </span>
                    </p>
                    <hr className="bg-gray-600 my-6" />
                    <div className="overflow-x-auto">
                        <table className="table-auto border-collapse w-full max-w-72">
                            <tbody>
                                <tr>
                                    <td className="text-gray-600 font-medium">Brand</td>
                                    <td className="text-gray-800/50 ">{productData.brand}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium">Color</td>
                                    <td className="text-gray-800/50 ">
                                        <div className="flex gap-2 flex-wrap">
                                            {(() => {
                                                const availableColors = getAvailableColors();
                                                return availableColors.length > 0 ? (
                                                    availableColors.map((c, idx) => (
                                                        <div key={c._id || idx} className="relative">
                                                            <button
                                                                type="button"
                                                                className={`w-6 h-6 rounded-full border-2 ${c.stock < 1 ? 'opacity-50' : ''} ${selectedColor === c.color ? 'border-orange-500 ring-2 ring-orange-300' : 'border-gray-300'} focus:outline-none`}
                                                                style={{ backgroundColor: c.color }}
                                                                onClick={() => {
                                                                    if (c.stock >= 1) {
                                                                        setSelectedColor(c.color);
                                                                        setQuantity(1); // Reset quantity when color changes
                                                                    }
                                                                }}
                                                                aria-label={`Select color ${c.color}`}
                                                                title={c.stock < 1 ? 'Out of stock' : `${c.stock} in stock`}
                                                            >
                                                                {selectedColor === c.color && <span className="block w-full h-full rounded-full border-2 border-white"></span>}
                                                            </button>
                                                            {c.stock < 1 && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-8 h-0.5 bg-red-500 transform rotate-45"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span>-</span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium">Size</td>
                                    <td className="text-gray-800/50 ">
                                        <div className="flex items-center justify-between mb-2">
                                            <button
                                                onClick={() => setShowSizeGuide(true)}
                                                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Size Guide
                                            </button>
                                            <button
                                                onClick={() => setShowSizeRecommendation(!showSizeRecommendation)}
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                                Find My Size
                                            </button>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {(() => {
                                                const availableSizes = getAvailableSizes();
                                                return availableSizes.length > 0 ? (
                                                    availableSizes.map((size, idx) => {
                                                        const sizeStock = getColorSizeStock(selectedColor, size);
                                                        const isOutOfStock = selectedColor && sizeStock <= 0;
                                                        const isDisabled = !selectedColor || isOutOfStock;

                                                        return (
                                                            <button
                                                                key={size}
                                                                type="button"
                                                                className={`px-2 py-1 rounded border text-xs font-medium relative ${isDisabled
                                                                    ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed border-gray-200'
                                                                    : selectedSize === size
                                                                        ? 'bg-orange-500 text-white border-orange-500'
                                                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                                    }`}
                                                                onClick={() => {
                                                                    if (!isDisabled) {
                                                                        setSelectedSize(size);
                                                                        setQuantity(1); // Reset quantity when size changes
                                                                    }
                                                                }}
                                                                disabled={isDisabled}
                                                                title={isOutOfStock ? `${size} is out of stock in ${selectedColor}` :
                                                                    selectedColor ? `${sizeStock} ${size} available in ${selectedColor}` :
                                                                        'Please select a color first'}
                                                            >
                                                                {size}
                                                                {isOutOfStock && (
                                                                    <span className="ml-1 text-red-400">✕</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <span>-</span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium">Category</td>
                                    <td className="text-gray-800/50">
                                        {productData.category}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Size Recommendation Tool */}
                    {showSizeRecommendation && sizeChart && (
                        <div className="mt-6">
                            <SizeRecommendation sizeChart={sizeChart} />
                        </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="mt-6">
                        <label className="block text-gray-600 font-medium mb-2">Quantity</label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                                disabled={quantity <= 1}
                            >
                                <Image src={assets.decrease_arrow} alt="decrease" width={12} height={12} />
                            </button>
                            <span className="min-w-[50px] text-center font-medium text-lg">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                    if (maxStock > 0 && quantity < maxStock) {
                                        setQuantity(quantity + 1);
                                    }
                                }}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                                disabled={(() => {
                                    const maxStock = getColorSizeStock(selectedColor, selectedSize);
                                    return !selectedColor || !selectedSize || quantity >= maxStock;
                                })()}
                            >
                                <Image src={assets.increase_arrow} alt="increase" width={12} height={12} />
                            </button>
                            {selectedColor && selectedSize && (
                                <span className="text-sm text-gray-500 ml-2">
                                    ({Math.max(0, getColorSizeStock(selectedColor, selectedSize) - quantity)} remaining after adding {quantity})
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center mt-10 gap-4">
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
                                                // Add items based on selected quantity
                                                for (let i = 0; i < quantity; i++) {
                                                    addToCart(productData._id, { color: selectedColor, size: selectedSize });
                                                }
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
                                                // Add items based on selected quantity
                                                for (let i = 0; i < quantity; i++) {
                                                    addToCart(productData._id, { color: selectedColor, size: selectedSize });
                                                }
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
            <div className="px-6 md:px-16 lg:px-32 py-12">
                <ProductReviews productId={id} />
            </div>

            {/* Recently Viewed Products */}
            <div className="px-6 md:px-16 lg:px-32 py-12">
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
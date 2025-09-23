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
import React from "react";
import toast from "react-hot-toast";

const Product = () => {

    const { id } = useParams();

    const { products, router, addToCart, user, getToken } = useAppContext();

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [isNotifying, setIsNotifying] = useState(false);
    const [notifySuccess, setNotifySuccess] = useState(false);

    const fetchProductData = async () => {
        // Safely find product and handle if products array is undefined
        if (Array.isArray(products)) {
            const product = products.find(product => product?._id === id);
            if (product) {
                setProductData(product);

                // Reset color and size selection when product changes
                setSelectedColor(null);
                setSelectedSize(null);

                // Set default color if available
                if (Array.isArray(product.color) && product.color.length > 0) {
                    // Find first color that has stock
                    const inStockColor = product.color.find(c => c.stock > 0);
                    if (inStockColor) {
                        setSelectedColor(inStockColor.color);
                    } else {
                        // If all colors are out of stock, just select the first one
                        setSelectedColor(product.color[0].color);
                    }
                }
            }
        }
    }

    useEffect(() => {
        fetchProductData();
    }, [id, products]);

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

    // Helper: get color object by value
    const getColorObj = (color) => (productData?.color || []).find(c => c.color === color);

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
                stock: Array.isArray(productData.color) && productData.color.length > 0
                    ? productData.color.reduce((total, color) => total + color.stock, 0)
                    : 10, // default to 10 if no color stock data
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
                        <Image
                            src={mainImage || productData.image[0]}
                            alt="alt"
                            className="w-full h-auto object-cover mix-blend-multiply"
                            width={1280}
                            height={720}
                        />
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
                    <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
                        {productData.name}
                    </h1>
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
                                            {Array.isArray(productData.color) && productData.color.length > 0 ? (
                                                productData.color.map((c, idx) => (
                                                    <div key={c._id || idx} className="relative">
                                                        <button
                                                            type="button"
                                                            className={`w-6 h-6 rounded-full border-2 ${c.stock < 1 ? 'opacity-50' : ''} ${selectedColor === c.color ? 'border-orange-500 ring-2 ring-orange-300' : 'border-gray-300'} focus:outline-none`}
                                                            style={{ backgroundColor: c.color }}
                                                            onClick={() => c.stock >= 1 && setSelectedColor(c.color)}
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
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-gray-600 font-medium">Size</td>
                                    <td className="text-gray-800/50 ">
                                        <div className="flex gap-2 flex-wrap">
                                            {Array.isArray(productData.sizes) && productData.sizes.length > 0 ? (
                                                productData.sizes.map((size, idx) => (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        className={`px-2 py-1 rounded border text-xs font-medium ${selectedColor && getColorObj(selectedColor)?.stock <= 0
                                                            ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                                                            : selectedSize === size
                                                                ? 'bg-orange-500 text-white border-orange-500'
                                                                : 'bg-gray-100 text-gray-700 border-gray-300'
                                                            }`}
                                                        onClick={() => {
                                                            if (selectedColor && getColorObj(selectedColor)?.stock > 0) {
                                                                setSelectedSize(size);
                                                            }
                                                        }}
                                                        disabled={selectedColor && getColorObj(selectedColor)?.stock <= 0}
                                                    >
                                                        {size}
                                                    </button>
                                                ))
                                            ) : (
                                                <span>-</span>
                                            )}
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

                    <div className="flex items-center mt-10 gap-4">
                        {/* Check if selected color is out of stock or not selected yet */}
                        {selectedColor && getColorObj(selectedColor) && getColorObj(selectedColor).stock <= 0 ? (
                            <button
                                onClick={subscribeToStockNotifications}
                                className={`w-full py-3.5 ${isNotifying ? 'bg-gray-200 cursor-wait' : notifySuccess ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'} transition`}
                                disabled={isNotifying || notifySuccess || !(selectedColor && selectedSize)}
                            >
                                {isNotifying ? 'Processing...' : notifySuccess ? 'You will be notified!' : 'Notify When In Stock'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => selectedColor && selectedSize && addToCart(productData._id, { color: selectedColor, size: selectedSize })}
                                    className={`w-full py-3.5 ${(selectedColor && selectedSize) ? 'bg-gray-100 text-gray-800/80 hover:bg-gray-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} transition`}
                                    disabled={!(selectedColor && selectedSize)}
                                >
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedColor && selectedSize) {
                                            addToCart(productData._id, { color: selectedColor, size: selectedSize });
                                            router.push('/cart');
                                        }
                                    }}
                                    className={`w-full py-3.5 ${(selectedColor && selectedSize) ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-orange-200 text-gray-400 cursor-not-allowed'} transition`}
                                    disabled={!(selectedColor && selectedSize)}
                                >
                                    Buy now
                                </button>
                            </>
                        )}
                    </div>

                    {/* Show message about stock status */}
                    <div className="mt-2 text-sm">
                        {!selectedColor ? (
                            <p className="text-gray-600">Please select a color to see availability.</p>
                        ) : selectedColor && getColorObj(selectedColor) ? (
                            getColorObj(selectedColor).stock <= 0 ? (
                                <p className="text-red-600">This item is currently out of stock.</p>
                            ) : getColorObj(selectedColor).stock < 10 ? (
                                <p className="text-orange-600">Only {getColorObj(selectedColor).stock} left in stock - order soon.</p>
                            ) : (
                                <p className="text-green-600">In stock and ready to ship.</p>
                            )
                        ) : (
                            <p className="text-gray-600">Stock information unavailable.</p>
                        )}
                    </div>
                </div>
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
    </>
    ) : <Loading />
};

export default Product;
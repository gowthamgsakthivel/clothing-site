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
import React from "react";

const Product = () => {

    const { id } = useParams();

    const { products, router, addToCart } = useAppContext()

    const [mainImage, setMainImage] = useState(null);
    const [productData, setProductData] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    const fetchProductData = async () => {
        const product = products.find(product => product._id === id);
        setProductData(product);
    }

    useEffect(() => {
        fetchProductData();
    }, [id, products.length])

    // Helper: get color object by value
    const getColorObj = (color) => (productData?.color || []).find(c => c.color === color);

    return productData ? (<>
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
                                                    <button
                                                        key={c._id || idx}
                                                        type="button"
                                                        className={`w-6 h-6 rounded-full border-2 ${selectedColor === c.color ? 'border-orange-500 ring-2 ring-orange-300' : 'border-gray-300'} focus:outline-none`}
                                                        style={{ backgroundColor: c.color }}
                                                        onClick={() => setSelectedColor(c.color)}
                                                        aria-label={`Select color ${c.color}`}
                                                        disabled={c.stock < 1}
                                                        title={c.stock < 1 ? 'Out of stock' : ''}
                                                    >
                                                        {selectedColor === c.color && <span className="block w-full h-full rounded-full border-2 border-white"></span>}
                                                    </button>
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
                                                        className={`px-2 py-1 rounded border text-xs font-medium ${selectedSize === size ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                                        onClick={() => setSelectedSize(size)}
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
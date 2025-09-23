'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import LoadingButton from "@/components/LoadingButton";

const AddProduct = () => {
    const { getToken } = useAppContext();

    const [files, setFiles] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [genderCategory, setGenderCategory] = useState('Unisex');
    const [price, setPrice] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [brand, setBrand] = useState('');
    const [colors, setColors] = useState([]); // [{ color: string, stock: number }]
    const [sizes, setSizes] = useState([]);
    const [stock, setStock] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);

    // Form validation function
    const validateForm = () => {
        const newErrors = {};

        // Validate product name
        if (!name.trim()) {
            newErrors.name = "Product name is required";
        } else if (name.length < 3) {
            newErrors.name = "Name must be at least 3 characters";
        }

        // Validate description
        if (!description.trim()) {
            newErrors.description = "Description is required";
        } else if (description.length < 20) {
            newErrors.description = "Description must be at least 20 characters";
        }

        // Validate category
        if (!category) {
            newErrors.category = "Category is required";
        }

        // Validate price
        if (!price) {
            newErrors.price = "Price is required";
        } else if (isNaN(Number(price)) || Number(price) <= 0) {
            newErrors.price = "Price must be a positive number";
        }

        // Validate offer price
        if (!offerPrice) {
            newErrors.offerPrice = "Offer price is required";
        } else if (isNaN(Number(offerPrice)) || Number(offerPrice) <= 0) {
            newErrors.offerPrice = "Offer price must be a positive number";
        } else if (Number(offerPrice) >= Number(price)) {
            newErrors.offerPrice = "Offer price must be less than regular price";
        }

        // Validate brand
        if (!brand.trim()) {
            newErrors.brand = "Brand name is required";
        }

        // Validate colors
        if (colors.length === 0) {
            newErrors.colors = "At least one color must be selected";
        }

        // Validate sizes
        if (sizes.length === 0) {
            newErrors.sizes = "At least one size must be selected";
        }

        // Validate stock
        if (!stock) {
            newErrors.stock = "Stock quantity is required";
        } else if (isNaN(Number(stock)) || Number(stock) < 0 || !Number.isInteger(Number(stock))) {
            newErrors.stock = "Stock must be a positive integer";
        }

        // Validate images
        if (files.filter(Boolean).length === 0) {
            newErrors.files = "At least one image is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        if (!validateForm()) {
            toast.error("Please correct the errors in the form");
            return;
        }

        setIsLoading(true);
        const formData = new FormData();

        formData.append('name', name);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('genderCategory', genderCategory);
        formData.append('price', price);
        formData.append('offerPrice', offerPrice);
        formData.append('brand', brand);

        colors.forEach(({ color, stock }) => {
            formData.append('colors[]', JSON.stringify({ color, stock }));
        });

        for (let i = 0; i < files.length; i++) {
            if (files[i]) {
                formData.append('images', files[i]);
            }
        }

        sizes.forEach(size => formData.append('sizes', size));
        formData.append('stock', stock);

        try {
            const token = await getToken();

            const { data } = await axios.post('/api/product/add', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                // Reset form
                setFiles([]);
                setName('');
                setDescription('');
                setCategory('Shorts');
                setGenderCategory('Unisex');
                setPrice('');
                setOfferPrice('');
                setBrand('');
                setColors([]);
                setSizes([]);
                setStock('');
                setFormSubmitted(false);
            } else {
                toast.error(data.message || "Failed to add product");
            }
        } catch (error) {
            console.error("Error adding product:", error);

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.message) {
                toast.error(error.message);
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between">
            <div className="mb-6 p-4 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Add New Product</h1>
                <p className="text-gray-600 mt-1">Fill out the form below to add a new product to your inventory</p>
            </div>

            <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
                <div>
                    <p className="text-base font-medium">Product Image</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        {[...Array(4)].map((_, index) => (
                            <label key={index} htmlFor={`image${index}`}>
                                <input
                                    onChange={(e) => {
                                        const updatedFiles = [...files];
                                        updatedFiles[index] = e.target.files[0];
                                        setFiles(updatedFiles);
                                        if (formSubmitted) validateForm();
                                    }}
                                    type="file"
                                    id={`image${index}`}
                                    accept="image/*"
                                    hidden
                                />
                                <Image
                                    key={index}
                                    className={`max-w-24 cursor-pointer ${errors.files && formSubmitted && files.filter(Boolean).length === 0 ? 'border border-red-500' : ''}`}
                                    src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                                    alt=""
                                    width={100}
                                    height={100}
                                />
                            </label>
                        ))}
                    </div>
                    {errors.files && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.files}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="product-name">
                        Product Name
                    </label>
                    <input
                        id="product-name"
                        type="text"
                        placeholder="Type here"
                        className={`outline-none md:py-2.5 py-2 px-3 rounded border ${errors.name && formSubmitted ? 'border-red-500' : 'border-gray-500/40'}`}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (formSubmitted) validateForm();
                        }}
                        value={name}
                    />
                    {errors.name && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label
                        className="text-base font-medium"
                        htmlFor="product-description"
                    >
                        Product Description
                    </label>
                    <textarea
                        id="product-description"
                        rows={4}
                        className={`outline-none md:py-2.5 py-2 px-3 rounded border ${errors.description && formSubmitted ? 'border-red-500' : 'border-gray-500/40'} resize-none`}
                        placeholder="Type here"
                        onChange={(e) => {
                            setDescription(e.target.value);
                            if (formSubmitted) validateForm();
                        }}
                        value={description}
                    ></textarea>
                    {errors.description && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                </div>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-base font-medium block mb-2">Sizes</label>
                        <div className="flex flex-wrap gap-2">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                <label key={size} className={`px-3 py-1 rounded border cursor-pointer ${sizes.includes(size) ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                    <input
                                        type="checkbox"
                                        value={size}
                                        checked={sizes.includes(size)}
                                        onChange={e => {
                                            if (e.target.checked) setSizes([...sizes, size]);
                                            else setSizes(sizes.filter(s => s !== size));
                                            if (formSubmitted) validateForm();
                                        }}
                                        className="hidden"
                                    />
                                    {size}
                                </label>
                            ))}
                        </div>
                        {errors.sizes && formSubmitted && (
                            <p className="text-red-500 text-sm mt-1">{errors.sizes}</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 w-32">
                        <label className="text-base font-medium" htmlFor="stock">
                            Stock Quantity
                        </label>
                        <input
                            id="stock"
                            type="number"
                            placeholder="0"
                            className={`outline-none md:py-2.5 py-2 px-3 rounded border ${errors.stock && formSubmitted ? 'border-red-500' : 'border-gray-500/40'}`}
                            onChange={(e) => {
                                setStock(e.target.value);
                                if (formSubmitted) validateForm();
                            }}
                            value={stock}
                        />
                        {errors.stock && formSubmitted && (
                            <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                        )}
                    </div>
                    <label className="text-base font-medium" htmlFor="brand">
                        Brand
                    </label>
                    <input
                        id="brand"
                        type="text"
                        placeholder="Brand name"
                        className={`outline-none md:py-2.5 py-2 px-3 rounded border ${errors.brand && formSubmitted ? 'border-red-500' : 'border-gray-500/40'}`}
                        onChange={(e) => {
                            setBrand(e.target.value);
                            if (formSubmitted) validateForm();
                        }}
                        value={brand}
                    />
                    {errors.brand && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1 w-32">
                    <label className="text-base font-medium" htmlFor="color">Color & Units</label>
                    <div className="flex flex-col gap-2 mt-2">
                        {["#607D8B", "#222", "#ccc", "#E53935", "#43A047", "#1976D2", "#FBC02D", "#fff"].map((c) => {
                            const colorObj = colors.find(col => col.color === c);
                            return (
                                <div key={c} className="flex items-center gap-2">
                                    <label className="relative flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="color"
                                            value={c}
                                            checked={!!colorObj}
                                            onChange={() => {
                                                if (colorObj) setColors(colors.filter(col => col.color !== c));
                                                else setColors([...colors, { color: c, stock: 1 }]);
                                                if (formSubmitted) validateForm();
                                            }}
                                            className={`peer appearance-none w-6 h-6 rounded-full border ${errors.colors && formSubmitted && colors.length === 0 ? 'border-red-500' : 'border-gray-400'} checked:ring-2 checked:ring-black focus:outline-none`}
                                            style={{ backgroundColor: c }}
                                        />
                                        <span
                                            className="absolute left-0 top-0 w-6 h-6 rounded-full border-2 border-black pointer-events-none"
                                            style={{ display: colorObj ? "block" : "none" }}
                                        ></span>
                                    </label>
                                    {colorObj && (
                                        <input
                                            type="number"
                                            min={1}
                                            className="w-16 px-2 py-1 border rounded"
                                            value={colorObj.stock}
                                            onChange={e => {
                                                setColors(colors.map(col => col.color === c ? { ...col, stock: Number(e.target.value) } : col));
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {errors.colors && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.colors}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1 w-32">
                    <label className="text-base font-medium" htmlFor="category">
                        Category
                    </label>
                    <select
                        id="category"
                        className={`outline-none md:py-2.5 py-2 px-3 rounded border ${errors.category && formSubmitted ? 'border-red-500' : 'border-gray-500/40'}`}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            if (formSubmitted) validateForm();
                        }}
                        value={category}
                    >
                        <option value="">Select a category</option>
                        <option value="Shorts">Shorts</option>
                        <option value="Pants">Pants</option>
                        <option value="T-Shirts">T-Shirts</option>
                        <option value="Tights">Tights</option>
                        <option value="Socks">Socks</option>
                        <option value="Sleeveless">Sleeveless</option>
                        <option value="Accessories">Accessories</option>
                    </select>
                    {errors.category && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1 w-32">
                    <label className="text-base font-medium" htmlFor="genderCategory">
                        Gender/Age
                    </label>
                    <select
                        id="genderCategory"
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
                        onChange={(e) => setGenderCategory(e.target.value)}
                        value={genderCategory}
                    >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                        <option value="Girls">Girls</option>
                        <option value="Boys">Boys</option>
                        <option value="Unisex">Unisex</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1 w-32">
                    <label className="text-base font-medium" htmlFor="product-price">
                        Product Price
                    </label>
                    <input
                        id="product-price"
                        type="number"
                        placeholder="0"
                        className={`outline-none md:py-2.5 py-2 px-3 rounded border ${errors.price && formSubmitted ? 'border-red-500' : 'border-gray-500/40'}`}
                        onChange={(e) => {
                            setPrice(e.target.value);
                            if (formSubmitted) validateForm();
                        }}
                        value={price}
                    />
                    {errors.price && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1 w-32">
                    <label className="text-base font-medium" htmlFor="offer-price">
                        Offer Price
                    </label>
                    <input
                        id="offer-price"
                        type="number"
                        placeholder="0"
                        className={`outline-none md:py-2.5 py-2 px-3 rounded border ${errors.offerPrice && formSubmitted ? 'border-red-500' : 'border-gray-500/40'}`}
                        onChange={(e) => {
                            setOfferPrice(e.target.value);
                            if (formSubmitted) validateForm();
                        }}
                        value={offerPrice}
                    />
                    {errors.offerPrice && formSubmitted && (
                        <p className="text-red-500 text-sm mt-1">{errors.offerPrice}</p>
                    )}
                </div>
                <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                    loadingText="ADDING..."
                    className="px-8 py-2.5 font-medium rounded bg-orange-600 text-white hover:bg-orange-700"
                >
                    ADD
                </LoadingButton>
            </form>
        </div>
    );
};

export default AddProduct;
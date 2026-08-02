'use client'
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';
import {
    Plus, Upload, X, Trash2, CheckCircle2, Sparkles,
    Boxes, DollarSign, Layers, Tag
} from 'lucide-react';

const AddProduct = () => {
    const { user, getToken } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);

    const [productData, setProductData] = useState({
        name: '',
        description: '',
        price: '',
        offerPrice: '',
        collectionName: 'products',
        sportCategory: '',
        category: '',
        genderCategory: 'Unisex',
        brand: '',
        variants: []
    });

    const [imageUrls, setImageUrls] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const categories = ['T-Shirt', 'Shirt', 'Pants', 'Shorts', 'Hoodie', 'Jacket', 'Accessories'];
    const sportCategories = [
        { value: 'cricket', label: 'Cricket' },
        { value: 'football', label: 'Football' },
        { value: 'basketball', label: 'Basketball' },
        { value: 'badminton', label: 'Badminton' },
        { value: 'tennis', label: 'Tennis' },
        { value: 'gym', label: 'Gym & Fitness' }
    ];

    const addColorVariant = () => {
        setProductData(prev => ({
            ...prev,
            variants: [...prev.variants, {
                color: {
                    name: '',
                    code: '#6366f1',
                    image: ''
                },
                sizeStock: availableSizes.map(size => ({
                    size,
                    quantity: 0,
                    lowStockThreshold: 5,
                    originalPrice: '',
                    offerPrice: ''
                }))
            }]
        }));
    };

    const updateColor = (colorIndex, field, value) => {
        setProductData(prev => {
            const nextVariants = [...prev.variants];
            nextVariants[colorIndex].color[field] = value;
            return { ...prev, variants: nextVariants };
        });
    };

    const updateSizeStock = (colorIndex, sizeIndex, field, value) => {
        setProductData(prev => {
            const nextVariants = [...prev.variants];
            const sizeRecord = { ...nextVariants[colorIndex].sizeStock[sizeIndex] };
            if (field === 'quantity' || field === 'lowStockThreshold') {
                sizeRecord[field] = value === '' ? 0 : parseInt(value, 10) || 0;
            } else if (field === 'isOutOfStock') {
                sizeRecord[field] = Boolean(value);
            } else {
                sizeRecord[field] = value;
            }
            nextVariants[colorIndex].sizeStock[sizeIndex] = sizeRecord;
            return { ...prev, variants: nextVariants };
        });
    };

    const removeColor = (colorIndex) => {
        setProductData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, index) => index !== colorIndex)
        }));
    };

    const uploadImage = async (file, token) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post('/api/admin/uploads/image', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        if (!response.data?.success) {
            throw new Error(response.data?.message || 'Image upload failed');
        }

        return response.data.url;
    };

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploadingImages(true);

        try {
            const token = await getToken();
            const uploadedUrls = await Promise.all(files.map((file) => uploadImage(file, token)));
            setImageUrls((prev) => {
                const nextUrls = [...prev, ...uploadedUrls];
                setImagePreviews(nextUrls);
                return nextUrls;
            });
        } catch (error) {
            toast.error(error.message || 'Failed to upload images');
        } finally {
            setIsUploadingImages(false);
            e.target.value = '';
        }
    };

    const removeImage = (indexToRemove) => {
        const newUrls = imageUrls.filter((_, index) => index !== indexToRemove);
        const newPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
        setImageUrls(newUrls);
        setImagePreviews(newPreviews);
    };

    const calculateTotalStock = () => {
        return productData.variants.reduce((total, colorData) => {
            return total + colorData.sizeStock.reduce((colorTotal, sizeData) => {
                return colorTotal + sizeData.quantity;
            }, 0);
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please sign in to add products');
            return;
        }

        if (productData.collectionName === 'sports' && !productData.sportCategory) {
            toast.error('Please select a sport type');
            return;
        }

        if (productData.variants.length === 0) {
            toast.error('Please add at least one color variant');
            return;
        }

        for (let i = 0; i < productData.variants.length; i++) {
            const colorVariant = productData.variants[i];

            const colorName = colorVariant.color.name?.trim();
            if (!colorName) {
                toast.error(`Color name is required for variant ${i + 1}`);
                return;
            }

            if (colorName.startsWith('#')) {
                toast.error(`Please enter a color name (not a hex code) for variant ${i + 1}`);
                return;
            }

            const hasStock = colorVariant.sizeStock.some(size => size.quantity > 0);
            if (!hasStock) {
                toast.error(`At least one size must have stock for ${colorVariant.color.name}`);
                return;
            }
        }

        if (isUploadingImages) {
            toast.error('Please wait for image uploads to finish');
            return;
        }

        if (imageUrls.length === 0) {
            toast.error('Please add at least one product image');
            return;
        }

        setIsLoading(true);

        try {
            const token = await getToken();

            const variants = productData.variants.flatMap((variant) => {
                const colorName = variant.color.name?.trim();
                return variant.sizeStock
                    .filter((sizeData) => sizeData.quantity > 0)
                    .map((sizeData) => ({
                        color: colorName,
                        colorCode: variant.color.code,
                        size: sizeData.size,
                        originalPrice: Number(sizeData.originalPrice || productData.price),
                        offerPrice: Number(sizeData.offerPrice || productData.offerPrice),
                        images: imageUrls,
                        quantity: sizeData.quantity
                    }));
            });

            const response = await axios.post('/api/admin/products/full-create', {
                product: {
                    name: productData.name,
                    description: productData.description,
                    collectionName: productData.collectionName,
                    sportCategory: productData.collectionName === 'sports' ? productData.sportCategory : null,
                    category: productData.category,
                    genderCategory: productData.genderCategory,
                    brand: productData.brand,
                    status: 'active'
                },
                variants
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.data.success) {
                toast.error(response.data.message || 'Failed to add product');
                return;
            }

            toast.success('Product published to catalog!');
            setProductData({
                name: '',
                description: '',
                price: '',
                offerPrice: '',
                collectionName: 'products',
                sportCategory: '',
                category: '',
                genderCategory: 'Unisex',
                brand: '',
                variants: []
            });
            setImageUrls([]);
            setImagePreviews([]);

        } catch (error) {
            if (error.response) {
                toast.error(error.response.data?.message || 'Server error occurred');
            } else if (error.request) {
                toast.error('Network error - please check your connection');
            } else {
                toast.error('Failed to add product');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-16 text-center text-slate-500 font-bold">
                Please sign in to access product creation.
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Catalog Product</h2>
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                            Total Stock: {calculateTotalStock()} units
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Configure product specs, upload high-res images, and initialize variant inventory.</p>
                </div>

                <button
                    type="submit"
                    form="add-product-form"
                    disabled={isLoading || isUploadingImages}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-sm disabled:opacity-50 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>{isUploadingImages ? 'Uploading Images...' : (isLoading ? 'Publishing...' : 'Publish Product')}</span>
                </button>
            </div>

            {/* Main Form Container */}
            <form id="add-product-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">Basic Product Specs</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Product Title *</label>
                            <input
                                type="text"
                                value={productData.name}
                                onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Pro Performance Cricket Jersey"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Brand *</label>
                            <input
                                type="text"
                                value={productData.brand}
                                onChange={(e) => setProductData(prev => ({ ...prev, brand: e.target.value }))}
                                placeholder="e.g. Sparrow Sports"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Store Collection *</label>
                            <select
                                value={productData.collectionName}
                                onChange={(e) => setProductData(prev => ({
                                    ...prev,
                                    collectionName: e.target.value,
                                    sportCategory: e.target.value === 'sports' ? prev.sportCategory : ''
                                }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                required
                            >
                                <option value="products">Products (General)</option>
                                <option value="sports">Sports Gear</option>
                                <option value="devotional">Devotional Apparel</option>
                                <option value="political">Political Apparel</option>
                            </select>
                        </div>

                        {productData.collectionName === 'sports' && (
                            <div>
                                <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Sport Category *</label>
                                <select
                                    value={productData.sportCategory}
                                    onChange={(e) => setProductData(prev => ({ ...prev, sportCategory: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Select Sport</option>
                                    {sportCategories.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Apparel Type Category *</label>
                            <select
                                value={productData.category}
                                onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Gender / Fitting Category</label>
                            <select
                                value={productData.genderCategory}
                                onChange={(e) => setProductData(prev => ({ ...prev, genderCategory: e.target.value }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="Unisex">Unisex</option>
                                <option value="Men">Men</option>
                                <option value="Women">Women</option>
                                <option value="Kids">Kids</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Base Price (MSRP ₹) *</label>
                            <input
                                type="number"
                                value={productData.price}
                                onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="1499"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Selling Offer Price (₹) *</label>
                            <input
                                type="number"
                                value={productData.offerPrice}
                                onChange={(e) => setProductData(prev => ({ ...prev, offerPrice: e.target.value }))}
                                placeholder="999"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-emerald-600 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-extrabold uppercase text-slate-500 block mb-1.5">Detailed Description *</label>
                        <textarea
                            value={productData.description}
                            onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            placeholder="Write comprehensive product features, material composition, care instructions..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-900 leading-relaxed focus:bg-white focus:border-indigo-500 focus:outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Media Upload Container */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Product Media Upload</h3>

                    <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-3xl p-8 text-center transition-all bg-slate-50/50 group">
                        <input
                            type="file"
                            multiple={true}
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center pointer-events-none">
                            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-900">Click or drag image files here</p>
                            <p className="text-[11px] text-slate-500 mt-1">Upload high quality JPG or PNG product shots (Max 5MB each)</p>
                        </div>
                    </div>

                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                    <Image
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        width={200}
                                        height={200}
                                        className="w-full h-32 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-xl text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Color Variants Container */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900">Variants & Size Inventory</h3>
                            <p className="text-xs text-slate-500">Configure size matrices for each color option</p>
                        </div>
                        <button
                            type="button"
                            onClick={addColorVariant}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Color Variant</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {productData.variants.map((colorData, colorIndex) => (
                            <ColorInventoryCard
                                key={colorIndex}
                                colorData={colorData}
                                colorIndex={colorIndex}
                                availableSizes={availableSizes}
                                onUpdateColor={updateColor}
                                onUpdateSizeStock={updateSizeStock}
                                onRemoveColor={removeColor}
                            />
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
};

const ColorInventoryCard = ({
    colorData,
    colorIndex,
    availableSizes,
    onUpdateColor,
    onUpdateSizeStock,
    onRemoveColor
}) => {
    const calculateColorTotal = () => {
        return colorData.sizeStock.reduce((total, size) => total + size.quantity, 0);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={colorData.color.code}
                            onChange={(e) => onUpdateColor(colorIndex, 'code', e.target.value)}
                            className="h-10 w-12 rounded-xl border border-slate-200 bg-white cursor-pointer"
                        />
                    </div>
                    <div className="space-y-1">
                        <input
                            type="text"
                            placeholder="Color Name (e.g. Royal Blue)"
                            value={colorData.color.name}
                            onChange={(e) => onUpdateColor(colorIndex, 'name', e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-bold focus:border-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        {calculateColorTotal()} Units Total
                    </span>
                    <button
                        type="button"
                        onClick={() => onRemoveColor(colorIndex)}
                        className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSizes.map((size, sizeIndex) => {
                    const sizeData = colorData.sizeStock[sizeIndex];

                    return (
                        <div key={size} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">{size}</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(sizeData.isOutOfStock)}
                                        onChange={(e) => onUpdateSizeStock(colorIndex, sizeIndex, 'isOutOfStock', e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                    />
                                    <span>Out of Stock</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">Stock Amount</label>
                                    <input
                                        type="number"
                                        value={sizeData.quantity}
                                        onChange={(e) => onUpdateSizeStock(colorIndex, sizeIndex, 'quantity', e.target.value)}
                                        className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-slate-900 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none text-xs"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">Low Alert Threshold</label>
                                    <input
                                        type="number"
                                        value={sizeData.lowStockThreshold || 5}
                                        onChange={(e) => onUpdateSizeStock(colorIndex, sizeIndex, 'lowStockThreshold', e.target.value)}
                                        className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-slate-600 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none text-xs"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                <div>
                                    <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">Original Price (opt)</label>
                                    <input
                                        type="number"
                                        placeholder="Default"
                                        value={sizeData.originalPrice || ''}
                                        onChange={(e) => onUpdateSizeStock(colorIndex, sizeIndex, 'originalPrice', e.target.value)}
                                        className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-slate-800 font-mono font-semibold focus:bg-white focus:border-indigo-500 focus:outline-none text-xs"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-extrabold uppercase text-slate-500 block mb-0.5">Offer Price (opt)</label>
                                    <input
                                        type="number"
                                        placeholder="Default"
                                        value={sizeData.offerPrice || ''}
                                        onChange={(e) => onUpdateSizeStock(colorIndex, sizeIndex, 'offerPrice', e.target.value)}
                                        className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-emerald-600 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none text-xs"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AddProduct;

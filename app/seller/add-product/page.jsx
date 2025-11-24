'use client'
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';
import { assets } from '@/assets/assets';

const AddProduct = () => {
    const { user, getToken } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);

    const [productData, setProductData] = useState({
        name: '',
        description: '',
        price: '',
        offerPrice: '',
        category: '',
        genderCategory: 'Unisex',
        brand: '',
        inventory: [],
        stockSettings: {
            trackInventory: true,
            allowBackorders: false,
            globalLowStockThreshold: 10
        }
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const categories = ['T-Shirt', 'Shirt', 'Pants', 'Shorts', 'Hoodie', 'Jacket', 'Accessories'];

    // Add new color variant
    const addColorVariant = () => {
        setProductData(prev => ({
            ...prev,
            inventory: [...prev.inventory, {
                color: {
                    name: '',
                    code: '#000000',
                    image: ''
                },
                sizeStock: availableSizes.map(size => ({
                    size,
                    quantity: 0,
                    lowStockThreshold: 5
                }))
            }]
        }));
    };

    // Update color information
    const updateColor = (colorIndex, field, value) => {
        setProductData(prev => {
            const newInventory = [...prev.inventory];
            newInventory[colorIndex].color[field] = value;
            return { ...prev, inventory: newInventory };
        });
    };

    // Update size stock
    const updateSizeStock = (colorIndex, sizeIndex, field, value) => {
        setProductData(prev => {
            const newInventory = [...prev.inventory];
            newInventory[colorIndex].sizeStock[sizeIndex][field] = parseInt(value) || 0;
            return { ...prev, inventory: newInventory };
        });
    };

    // Remove color variant
    const removeColor = (colorIndex) => {
        setProductData(prev => ({
            ...prev,
            inventory: prev.inventory.filter((_, index) => index !== colorIndex)
        }));
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);

        // Create previews
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    // Calculate total stock
    const calculateTotalStock = () => {
        return productData.inventory.reduce((total, colorData) => {
            return total + colorData.sizeStock.reduce((colorTotal, sizeData) => {
                return colorTotal + sizeData.quantity;
            }, 0);
        }, 0);
    };

    // Submit product
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please sign in to add products');
            return;
        }

        if (productData.inventory.length === 0) {
            toast.error('Please add at least one color variant');
            return;
        }

        // Validate inventory data
        for (let i = 0; i < productData.inventory.length; i++) {
            const colorVariant = productData.inventory[i];

            if (!colorVariant.color.name || colorVariant.color.name.trim() === '') {
                toast.error(`Color name is required for variant ${i + 1}`);
                return;
            }

            const hasStock = colorVariant.sizeStock.some(size => size.quantity > 0);
            if (!hasStock) {
                toast.error(`At least one size must have stock for ${colorVariant.color.name}`);
                return;
            }
        }

        if (images.length === 0) {
            toast.error('Please add at least one product image');
            return;
        }

        setIsLoading(true);

        try {
            // Debug: Log the inventory data being sent
            console.log('Inventory data being sent:', JSON.stringify(productData.inventory, null, 2));

            const formData = new FormData();

            // Add basic product data
            Object.keys(productData).forEach(key => {
                if (key !== 'inventory' && key !== 'stockSettings') {
                    formData.append(key, productData[key]);
                }
            });

            // Add inventory data as JSON
            formData.append('inventory', JSON.stringify(productData.inventory));
            formData.append('stockSettings', JSON.stringify(productData.stockSettings));

            // Add total stock
            formData.append('totalStock', calculateTotalStock());

            // Add images
            images.forEach((image, index) => {
                formData.append(`image${index}`, image);
            });
            formData.append('imageCount', images.length);

            const token = await getToken();
            const response = await axios.post('/api/admin/products/add', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('Product added successfully!');
                // Reset form
                setProductData({
                    name: '',
                    description: '',
                    price: '',
                    offerPrice: '',
                    category: '',
                    genderCategory: 'Unisex',
                    brand: '',
                    inventory: [],
                    stockSettings: {
                        trackInventory: true,
                        allowBackorders: false,
                        globalLowStockThreshold: 10
                    }
                });
                setImages([]);
                setImagePreviews([]);
            } else {
                toast.error(response.data.message || 'Failed to add product');
            }

        } catch (error) {
            console.error('Error adding product:', error);

            // Log the full error details
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                toast.error(error.response.data?.message || 'Server error occurred');
            } else if (error.request) {
                console.error('No response received:', error.request);
                toast.error('Network error - please check your connection');
            } else {
                console.error('Error message:', error.message);
                toast.error('Failed to add product');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Access Denied</h2>
                    <p className="text-gray-500">Please sign in to add products.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Add New Product</h1>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Product Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    value={productData.name}
                                    onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand *
                                </label>
                                <input
                                    type="text"
                                    value={productData.brand}
                                    onChange={(e) => setProductData(prev => ({ ...prev, brand: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={productData.category}
                                    onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gender Category
                                </label>
                                <select
                                    value={productData.genderCategory}
                                    onChange={(e) => setProductData(prev => ({ ...prev, genderCategory: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="Unisex">Unisex</option>
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Kids">Kids</option>
                                    <option value="Girls">Girls</option>
                                    <option value="Boys">Boys</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Original Price *
                                </label>
                                <input
                                    type="number"
                                    value={productData.price}
                                    onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Offer Price *
                                </label>
                                <input
                                    type="number"
                                    value={productData.offerPrice}
                                    onChange={(e) => setProductData(prev => ({ ...prev, offerPrice: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={productData.description}
                                onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>

                        {/* Product Images */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images *
                            </label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />

                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative">
                                            <Image
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                width={200}
                                                height={200}
                                                className="w-full h-32 object-cover rounded-md border"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Inventory Management */}
                        <div className="border-t pt-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800">Inventory Management</h2>
                                <div className="text-sm text-gray-600">
                                    Total Stock: <span className="font-semibold text-orange-600">{calculateTotalStock()}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {productData.inventory.map((colorData, colorIndex) => (
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

                                <button
                                    type="button"
                                    onClick={addColorVariant}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">+</span>
                                    Add Color Variant
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Adding Product...' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Color Inventory Card Component
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
        <div className="bg-gray-50 rounded-lg p-6 border">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: colorData.color.code }}
                    ></div>
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Color name (e.g., Red, Blue)"
                            value={colorData.color.name}
                            onChange={(e) => onUpdateColor(colorIndex, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <input
                            type="color"
                            value={colorData.color.code}
                            onChange={(e) => onUpdateColor(colorIndex, 'code', e.target.value)}
                            className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        Color Total: <span className="font-semibold text-blue-600">{calculateColorTotal()}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRemoveColor(colorIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                    >
                        Remove
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {availableSizes.map((size, sizeIndex) => {
                    const sizeData = colorData.sizeStock[sizeIndex];
                    const isLowStock = sizeData.quantity <= sizeData.lowStockThreshold;

                    return (
                        <div key={size} className="bg-white rounded-lg p-3 border">
                            <div className="text-center font-medium text-gray-700 mb-2">{size}</div>
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        value={sizeData.quantity}
                                        onChange={(e) => onUpdateSizeStock(colorIndex, sizeIndex, 'quantity', e.target.value)}
                                        className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 ${isLowStock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Alert at</label>
                                    <input
                                        type="number"
                                        value={sizeData.lowStockThreshold}
                                        onChange={(e) => onUpdateSizeStock(colorIndex, sizeIndex, 'lowStockThreshold', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        min="0"
                                    />
                                </div>
                                {isLowStock && sizeData.quantity > 0 && (
                                    <div className="text-xs text-red-600 text-center">Low Stock!</div>
                                )}
                                {sizeData.quantity === 0 && (
                                    <div className="text-xs text-red-700 text-center font-medium">Out of Stock</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AddProduct;
'use client'
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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

        if (images.length === 0) {
            toast.error('Please add at least one product image');
            return;
        }

        setIsLoading(true);

        try {
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
            toast.error('Failed to add product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Add New Product</h1>

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
            <Footer />
        </>
    );
    // Get low stock items helper
    const getLowStockItems = () => {
        if (!stockData) return [];

        const lowStockItems = [];
        stockData.inventory.forEach((colorData, colorIndex) => {
            colorData.sizeStock.forEach((sizeData, sizeIndex) => {
                if (sizeData.quantity <= sizeData.lowStockThreshold) {
                    lowStockItems.push({
                        color: colorData.color.name,
                        size: sizeData.size,
                        quantity: sizeData.quantity,
                        threshold: sizeData.lowStockThreshold,
                        colorIndex,
                        sizeIndex
                    });
                }
            });
        });
        return lowStockItems;
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Access Denied</h2>
                        <p className="text-gray-500">Please sign in to manage products.</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-lg">
                    {/* Header with Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="px-8 py-6">
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">Product Management</h1>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'add'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Add New Product
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('manage');
                                        if (products.length === 0) fetchProducts();
                                    }}
                                    className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'manage'
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Manage Stock
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {activeTab === 'add' ? (
                            <AddProductForm
                                productData={productData}
                                setProductData={setProductData}
                                images={images}
                                setImages={setImages}
                                imagePreviews={imagePreviews}
                                setImagePreviews={setImagePreviews}
                                availableSizes={availableSizes}
                                categories={categories}
                                isLoading={isLoading}
                                handleSubmit={handleSubmit}
                                addColorVariant={addColorVariant}
                                updateColor={updateColor}
                                updateSizeStock={updateSizeStock}
                                removeColor={removeColor}
                                handleImageChange={handleImageChange}
                                calculateTotalStock={calculateTotalStock}
                            />
                        ) : (
                            <ManageStockSection
                                products={filteredProducts}
                                selectedProduct={selectedProduct}
                                setSelectedProduct={setSelectedProduct}
                                stockData={stockData}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                isLoading={isLoading}
                                isSaving={isSaving}
                                updateStock={updateStock}
                                getLowStockItems={getLowStockItems}
                            />
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

// Add Product Form Component
const AddProductForm = ({
    productData,
    setProductData,
    images,
    setImages,
    imagePreviews,
    setImagePreviews,
    availableSizes,
    categories,
    isLoading,
    handleSubmit,
    addColorVariant,
    updateColor,
    updateSizeStock,
    removeColor,
    handleImageChange,
    calculateTotalStock
}) => {
    return (
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
    );
};

// Manage Stock Section Component
const ManageStockSection = ({
    products,
    selectedProduct,
    setSelectedProduct,
    stockData,
    searchTerm,
    setSearchTerm,
    isLoading,
    isSaving,
    updateStock,
    getLowStockItems
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Products List */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Your Products</h2>
                        <input
                            type="text"
                            placeholder="🔍 Search products by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <Loading />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <p className="text-lg">📭 {searchTerm ? 'No products match your search' : 'No products found'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 p-4">
                                {products.map(product => (
                                    <div
                                        key={product._id}
                                        onClick={() => setSelectedProduct(product)}
                                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg border-2 ${selectedProduct?._id === product._id
                                                ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-500 shadow-md'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                {product.image?.[0] ? (
                                                    <Image
                                                        src={product.image[0]}
                                                        alt={product.name}
                                                        width={60}
                                                        height={60}
                                                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center text-gray-600 text-xs font-semibold">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-base truncate">{product.name}</h3>
                                                <p className="text-xs text-gray-500 mb-2 truncate">{product.category}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                                        📊 {product.totalStock || 0} units
                                                    </span>
                                                    {product.totalStock <= (product.stockSettings?.globalLowStockThreshold || 10) && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                                                            ⚠️ Low Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stock Details */}
            <div className="lg:col-span-1">
                {selectedProduct ? (
                    <div className="space-y-6">
                        {/* Product Header */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                {selectedProduct.image?.[0] ? (
                                    <Image
                                        src={selectedProduct.image[0]}
                                        alt={selectedProduct.name}
                                        width={100}
                                        height={100}
                                        className="w-20 h-20 object-cover rounded-md"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                                        No Image
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-xl font-semibold text-gray-800">{selectedProduct.name}</h2>
                                    <p className="text-gray-600 mt-1">{selectedProduct.category} • {selectedProduct.brand}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-lg font-semibold text-blue-600">
                                            Total Stock: {stockData?.totalStock || 0}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Colors: {stockData?.inventory?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        {stockData && getLowStockItems().length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="font-semibold text-red-800 mb-2">⚠️ Low Stock Alert</h3>
                                <div className="space-y-1">
                                    {getLowStockItems().map((item, index) => (
                                        <div key={index} className="text-sm text-red-700">
                                            {item.color} - {item.size}: {item.quantity} left (Alert at {item.threshold})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stock Management */}
                        {stockData ? (
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Stock Levels</h3>
                                <StockManagementGrid
                                    inventory={stockData.inventory}
                                    onUpdateStock={updateStock}
                                    isSaving={isSaving}
                                />
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-8 text-center">
                                <Loading />
                                <p className="text-gray-500 mt-2">Loading stock data...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Product</h3>
                        <p className="text-gray-500">Choose a product from the list to manage its stock levels</p>
                    </div>
                )}
            </div>
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
                                        className={`w-full px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 ${isLowStock ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
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
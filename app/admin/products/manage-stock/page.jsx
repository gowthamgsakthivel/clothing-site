'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';
import Loading from '@/components/Loading';

// Stock Management Grid Component - Define before Main Component
const StockManagementGrid = ({ inventory, onUpdateStock, isSaving }) => {
    const [pendingUpdates, setPendingUpdates] = useState([]);

    // Guard against undefined or empty inventory
    if (!inventory || !inventory.colors || inventory.colors.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No inventory data available</p>
            </div>
        );
    }

    const handleStockChange = (colorIndex, sizeIndex, field, value) => {
        const updateKey = `${colorIndex}-${sizeIndex}-${field}`;

        setPendingUpdates(prev => {
            const filtered = prev.filter(update =>
                !(update.colorIndex === colorIndex && update.sizeIndex === sizeIndex && update.field === field)
            );

            return [...filtered, {
                colorIndex,
                sizeIndex,
                field,
                value: parseInt(value) || 0,
                updateKey
            }];
        });
    };

    const applyUpdates = () => {
        if (pendingUpdates.length === 0) return;

        const updates = pendingUpdates.map(update => ({
            colorIndex: update.colorIndex,
            sizeIndex: update.sizeIndex,
            [update.field]: update.value
        }));

        onUpdateStock(updates);
        setPendingUpdates([]);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Color</th>
                            {inventory.colors[0]?.sizes?.map((_, sizeIdx) => (
                                <th key={sizeIdx} className="px-3 py-3 text-center font-semibold text-gray-700">
                                    {inventory.sizes?.[sizeIdx] || `Size ${sizeIdx}`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.colors.map((color, colorIdx) => (
                            <tr key={colorIdx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-full border border-gray-300"
                                            style={{ backgroundColor: color.colorCode }}
                                        />
                                        <span className="font-medium text-gray-900">{color.colorName}</span>
                                    </div>
                                </td>
                                {color.sizes.map((sizeData, sizeIdx) => (
                                    <td key={sizeIdx} className="px-3 py-3 text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                pendingUpdates.find(
                                                    u => u.colorIndex === colorIdx && u.sizeIndex === sizeIdx && u.field === 'quantity'
                                                )?.value ?? sizeData.quantity
                                            }
                                            onChange={(e) => handleStockChange(colorIdx, sizeIdx, 'quantity', e.target.value)}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                            disabled={isSaving}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pendingUpdates.length > 0 && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={() => setPendingUpdates([])}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={applyUpdates}
                        disabled={isSaving}
                        className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Updating...' : `Update Stock (${pendingUpdates.length})`}
                    </button>
                </div>
            )}
        </div>
    );
};

// Add Color Modal Component - Define before Main Component
const AddColorModal = ({ isOpen, onClose, onSubmit, newColorData, setNewColorData, isSaving, availableSizes }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 sticky top-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">🎨</span>
                            Add New Color
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl"
                            disabled={isSaving}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Color Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Red, Blue, Black"
                            value={newColorData.colorName}
                            onChange={(e) => setNewColorData({ ...newColorData, colorName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Color Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={newColorData.colorCode}
                                onChange={(e) => setNewColorData({ ...newColorData, colorCode: e.target.value })}
                                className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                disabled={isSaving}
                            />
                            <input
                                type="text"
                                placeholder="#000000"
                                value={newColorData.colorCode}
                                onChange={(e) => setNewColorData({ ...newColorData, colorCode: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    {/* Sizes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantities by Size
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {availableSizes.map((size, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <label className="w-12 text-sm font-medium text-gray-600">{size}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={newColorData.sizes[idx] || 0}
                                        onChange={(e) => {
                                            const newSizes = [...newColorData.sizes];
                                            newSizes[idx] = parseInt(e.target.value) || 0;
                                            setNewColorData({ ...newColorData, sizes: newSizes });
                                        }}
                                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                                        disabled={isSaving}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Adding...' : 'Add Color'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ManageStock = () => {
    const { user, getToken } = useAppContext();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddColorModal, setShowAddColorModal] = useState(false);
    const [newColorData, setNewColorData] = useState({
        name: '',
        code: '#000000',
        quantities: {
            XS: 0,
            S: 0,
            M: 0,
            L: 0,
            XL: 0,
            XXL: 0
        }
    });
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    //  // Fetch seller's products
    const fetchProducts = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const token = await getToken();
            const response = await axios.get('/api/product/seller-products', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setProducts(response.data.products);
            } else {
                toast.error('Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch stock data for selected product
    const fetchStockData = async (productId) => {
        try {
            const response = await axios.get(`/api/admin/products/stock-update?productId=${productId}`);
            if (response.data.success) {
                setStockData(response.data);
            } else {
                toast.error('Failed to fetch stock data');
            }
        } catch (error) {
            console.error('Error fetching stock data:', error);
            toast.error('Failed to fetch stock data');
        }
    };

    // Update stock levels
    const updateStock = async (updates) => {
        if (!selectedProduct) return;

        try {
            setIsSaving(true);
            const token = await getToken();

            const response = await axios.post('/api/admin/products/stock-update', {
                productId: selectedProduct._id,
                updates
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Stock updated successfully!');
                // Refresh stock data
                await fetchStockData(selectedProduct._id);
                // Update products list
                await fetchProducts();
            } else {
                toast.error(response.data.message || 'Failed to update stock');
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error('Failed to update stock');
        } finally {
            setIsSaving(false);
        }
    };

    // Add new color to existing product
    const addNewColor = async () => {
        if (!selectedProduct) {
            toast.error('Please select a product first');
            return;
        }

        if (!newColorData.name.trim()) {
            toast.error('Please enter a color name');
            return;
        }

        try {
            setIsSaving(true);
            const token = await getToken();

            const response = await axios.post('/api/admin/products/add-color', {
                productId: selectedProduct._id,
                colorName: newColorData.name.trim(),
                colorCode: newColorData.code,
                quantities: newColorData.quantities
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success(`Color "${newColorData.name}" added successfully!`);
                // Reset form
                setNewColorData({
                    name: '',
                    code: '#000000',
                    quantities: {
                        XS: 0,
                        S: 0,
                        M: 0,
                        L: 0,
                        XL: 0,
                        XXL: 0
                    }
                });
                setShowAddColorModal(false);
                // Refresh stock data
                await fetchStockData(selectedProduct._id);
            } else {
                toast.error(response.data.message || 'Failed to add color');
            }
        } catch (error) {
            console.error('Error adding color:', error);
            toast.error(error.response?.data?.message || 'Failed to add color');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProducts();
        }
    }, [user]);

    // Auto-select product from URL parameter
    useEffect(() => {
        const productId = searchParams.get('product');
        if (productId && products.length > 0) {
            const product = products.find(p => p._id === productId);
            if (product && (!selectedProduct || selectedProduct._id !== productId)) {
                setSelectedProduct(product);
                // Show a toast to indicate the product was auto-selected
                toast.success(`Selected "${product.name}" for stock management`, {
                    duration: 3000,
                    icon: '🎯'
                });

                // Scroll the selected product into view in the product list
                setTimeout(() => {
                    const productElement = document.getElementById(`product-${productId}`);
                    if (productElement) {
                        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            } else if (productId && !product) {
                toast.error(`Product not found or you don't have access to it`);
            }
        }
    }, [products, searchParams, selectedProduct]);

    useEffect(() => {
        if (selectedProduct) {
            fetchStockData(selectedProduct._id);
        }
    }, [selectedProduct]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Access Denied</h2>
                    <p className="text-gray-500">Please sign in to manage stock.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 w-full">
            {/* Navigation Breadcrumb */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <span className="text-gray-400">/</span>
                    <span>Product Management</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-800 font-medium">Stock Management</span>
                </div>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Stock Management</h1>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        Total Products: <span className="font-semibold">{products.length}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Products List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                            <h2 className="text-xl font-bold text-gray-900">📦 Your Products</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-12 text-center">
                                    <Loading />
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <p className="text-lg">📭 {searchTerm ? 'No products match your search' : 'No products found'}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 p-3">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product._id}
                                            id={`product-${product._id}`}
                                            onClick={() => setSelectedProduct(product)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${selectedProduct?._id === product._id
                                                ? 'bg-orange-100 border-orange-500 shadow-md'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                {product.image?.[0] ? (
                                                    <Image
                                                        src={product.image[0]}
                                                        alt={product.name}
                                                        width={50}
                                                        height={50}
                                                        className="w-12 h-12 object-cover rounded-md shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md flex items-center justify-center text-gray-600 text-xs font-semibold">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-sm truncate">{product.name}</h3>
                                                <p className="text-xs text-gray-500 truncate">{product.category}</p>
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <div className="font-bold text-blue-600 text-lg">{product.totalStock || 0}</div>
                                                <div className="text-xs text-gray-500">units</div>
                                                {product.totalStock <= (product.stockSettings?.globalLowStockThreshold || 10) && (
                                                    <div className="text-xs text-red-600 font-semibold mt-1">⚠️ Low</div>
                                                )}
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
                            {/* Auto-selection indicator */}
                            {searchParams.get('product') === selectedProduct._id && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <p className="text-blue-800 text-sm">
                                            <strong>Auto-selected:</strong> This product was automatically selected from your product list.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Product Header */}
                            <div className="bg-white rounded-lg shadow-md p-6">
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

                            {/* Add Color Button */}
                            <button
                                onClick={() => setShowAddColorModal(true)}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <span className="text-xl">🎨</span>
                                Add New Color
                            </button>

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
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Stock Levels</h3>
                                    <StockManagementGrid
                                        inventory={stockData.inventory}
                                        onUpdateStock={updateStock}
                                        isSaving={isSaving}
                                    />
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <Loading />
                                    <p className="text-gray-500 mt-2">Loading stock data...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
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

            {/* Add Color Modal */}
            <AddColorModal
                isOpen={showAddColorModal}
                onClose={() => setShowAddColorModal(false)}
                onSubmit={addNewColor}
                newColorData={newColorData}
                setNewColorData={setNewColorData}
                isSaving={isSaving}
                availableSizes={availableSizes}
            />

        </div>
    );
};

export default function ManageStockPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ManageStock />
        </Suspense>
    );
}
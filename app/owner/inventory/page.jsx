'use client'
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Image from 'next/image';
import Loading from '@/components/Loading';

const OwnerInventory = () => {
    const { user, getToken } = useAppContext();
    const searchParams = useSearchParams();
    const selectedProductId = searchParams.get('product');
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newColorName, setNewColorName] = useState('');
    const [newColorCode, setNewColorCode] = useState('#000000');
    const [newColorStock, setNewColorStock] = useState({
        XS: 0,
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0
    });
    const [isAddingColor, setIsAddingColor] = useState(false);

    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    const fetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = await getToken();
            const response = await axios.get('/api/product/seller-products', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setProducts(response.data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (selectedProductId && products.length > 0) {
            const matchedProduct = products.find(product => product._id === selectedProductId);
            if (matchedProduct) {
                handleSelectProduct(matchedProduct);
            }
        }
    }, [selectedProductId, products]);

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setStockData(product.inventory || []);
    };

    const handleStockChange = (colorIndex, sizeIndex, value) => {
        const newStock = [...stockData];
        newStock[colorIndex].sizeStock[sizeIndex].quantity = parseInt(value) || 0;
        setStockData(newStock);
    };

    const handleNewColorStockChange = (size, value) => {
        setNewColorStock(prev => ({
            ...prev,
            [size]: parseInt(value) || 0
        }));
    };

    const resetNewColorForm = () => {
        setNewColorName('');
        setNewColorCode('#000000');
        setNewColorStock({
            XS: 0,
            S: 0,
            M: 0,
            L: 0,
            XL: 0,
            XXL: 0
        });
    };

    const handleAddColor = async () => {
        if (!selectedProduct) return;

        const trimmedName = newColorName.trim();
        if (!trimmedName) {
            toast.error('Color name is required');
            return;
        }

        if (trimmedName.startsWith('#')) {
            toast.error('Please enter a color name (not a hex code)');
            return;
        }

        if (newColorCode.toLowerCase() === '#000000' && trimmedName.toLowerCase() !== 'black') {
            toast.error('Please pick a color code (default black is not selected)');
            return;
        }

        const existingNames = (stockData || [])
            .map(item => item.color?.name?.toLowerCase())
            .filter(Boolean);

        if (existingNames.includes(trimmedName.toLowerCase())) {
            toast.error(`Color "${trimmedName}" already exists`);
            return;
        }

        try {
            setIsAddingColor(true);
            const token = await getToken();
            const response = await axios.post(
                '/api/admin/products/add-color',
                {
                    productId: selectedProduct._id,
                    colorName: trimmedName,
                    colorCode: newColorCode,
                    quantities: newColorStock
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Color added');
                setStockData(response.data.product?.inventory || stockData);
                setSelectedProduct(prev => prev ? {
                    ...prev,
                    inventory: response.data.product?.inventory || prev.inventory
                } : prev);
                resetNewColorForm();
            } else {
                toast.error(response.data.message || 'Failed to add color');
            }
        } catch (error) {
            console.error('Error adding color:', error);
            toast.error('Failed to add color');
        } finally {
            setIsAddingColor(false);
        }
    };

    const handleSaveStock = async () => {
        if (!selectedProduct) return;

        try {
            setIsSaving(true);
            const token = await getToken();

            const updates = (stockData || []).flatMap((colorData, colorIndex) =>
                (colorData.sizeStock || []).map((sizeData, sizeIndex) => ({
                    colorIndex,
                    sizeIndex,
                    quantity: sizeData.quantity
                }))
            );

            const response = await axios.post(
                '/api/admin/products/stock-update',
                { productId: selectedProduct._id, updates },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Stock updated successfully');
                fetchProducts();
                setSelectedProduct(null);
                setStockData(null);
            }
        } catch (error) {
            console.error('Error saving stock:', error);
            toast.error('Failed to update stock');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading && products.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loading />
            </div>
        );
    }

    return (
        <div className="p-6 w-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory</h1>
                <p className="text-gray-600">Update product stock levels and colors</p>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                            <h2 className="font-semibold text-gray-900">Your Products</h2>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No products found
                                </div>
                            ) : (
                                filteredProducts.map((product) => (
                                    <div
                                        key={product._id}
                                        onClick={() => handleSelectProduct(product)}
                                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition ${selectedProduct?._id === product._id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {product.image?.[0] && (
                                                <Image
                                                    src={product.image[0]}
                                                    alt={product.name}
                                                    width={50}
                                                    height={50}
                                                    className="rounded"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {selectedProduct ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedProduct.name}</h3>
                                <p className="text-gray-600">Update stock for colors and sizes</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="px-4 py-2 text-left font-semibold">Color</th>
                                            <th className="px-4 py-2 text-center font-semibold">XS</th>
                                            <th className="px-4 py-2 text-center font-semibold">S</th>
                                            <th className="px-4 py-2 text-center font-semibold">M</th>
                                            <th className="px-4 py-2 text-center font-semibold">L</th>
                                            <th className="px-4 py-2 text-center font-semibold">XL</th>
                                            <th className="px-4 py-2 text-center font-semibold">XXL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockData?.map((colorData, colorIdx) => (
                                            <tr key={colorIdx} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 rounded border"
                                                            style={{ backgroundColor: colorData.color?.code || '#000' }}
                                                        />
                                                        <span className="font-medium">{colorData.color?.name}</span>
                                                    </div>
                                                </td>
                                                {colorData.sizeStock?.map((sizeData, sizeIdx) => (
                                                    <td key={sizeIdx} className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={sizeData.quantity || 0}
                                                            onChange={(e) => handleStockChange(colorIdx, sizeIdx, e.target.value)}
                                                            className={`w-12 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                                                                (sizeData.quantity || 0) < 5 ? 'bg-yellow-100 border-yellow-400' : 'border-gray-300'
                                                            }`}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900">Add new color</h4>
                                        <p className="text-xs text-gray-500">Create a new color variant and set starting stock</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Color name (e.g., Red)"
                                        value={newColorName}
                                        onChange={(e) => setNewColorName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newColorCode}
                                            onChange={(e) => setNewColorCode(e.target.value)}
                                            className="h-10 w-12 border border-gray-300 rounded"
                                        />
                                        <input
                                            type="text"
                                            value={newColorCode}
                                            onChange={(e) => setNewColorCode(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddColor}
                                            disabled={isAddingColor}
                                            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition font-medium"
                                        >
                                            {isAddingColor ? 'Adding...' : 'Add Color'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetNewColorForm}
                                            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {availableSizes.map(size => (
                                        <label key={size} className="text-xs text-gray-600">
                                            <span className="block mb-1 font-medium">{size}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newColorStock[size] ?? 0}
                                                onChange={(e) => handleNewColorStockChange(size, e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={handleSaveStock}
                                    disabled={isSaving}
                                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition font-medium"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-gray-600 font-medium">Select a product to manage inventory</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function OwnerInventoryPage() {
    return (
        <Suspense fallback={<Loading />}>
            <OwnerInventory />
        </Suspense>
    );
}

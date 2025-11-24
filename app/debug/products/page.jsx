"use client"
import { useState } from 'react';

const ProductDebugger = () => {
    const [productId, setProductId] = useState('');
    const [debugData, setDebugData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [allProducts, setAllProducts] = useState([]);

    const fetchAllProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/product/list?limit=50');
            const data = await response.json();
            if (data.success) {
                setAllProducts(data.products);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
        setLoading(false);
    };

    const debugProduct = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/debug/product/${id}`);
            const data = await response.json();
            setDebugData(data);
        } catch (error) {
            console.error('Error debugging product:', error);
            setDebugData({ success: false, message: error.message });
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Product Debug Tool</h1>

            <div className="space-y-4">
                {/* Product ID Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">Product ID:</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter product ID"
                        />
                        <button
                            onClick={() => debugProduct(productId)}
                            disabled={loading || !productId}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Debug Product'}
                        </button>
                    </div>
                </div>

                {/* Fetch All Products */}
                <div>
                    <button
                        onClick={fetchAllProducts}
                        disabled={loading}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Fetch All Products'}
                    </button>
                </div>

                {/* Products List */}
                {allProducts.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4">All Products ({allProducts.length})</h2>
                        <div className="grid gap-2">
                            {allProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="flex justify-between items-center p-3 border border-gray-200 rounded hover:bg-gray-50"
                                >
                                    <div>
                                        <span className="font-medium">{product.name}</span>
                                        <span className="text-sm text-gray-500 ml-2">({product._id})</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => debugProduct(product._id)}
                                            className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                                        >
                                            Debug
                                        </button>
                                        <button
                                            onClick={() => window.open(`/product/${product._id}`, '_blank')}
                                            className="bg-orange-500 text-white px-2 py-1 rounded text-sm hover:bg-orange-600"
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Debug Results */}
                {debugData && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4">Debug Results</h2>
                        <div className="bg-gray-100 p-4 rounded">
                            <pre className="text-xs overflow-auto">
                                {JSON.stringify(debugData, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDebugger;
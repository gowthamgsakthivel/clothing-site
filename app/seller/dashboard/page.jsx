'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import DesignAnalytics from '@/components/seller/DesignAnalytics';
import OverviewAnalytics from '@/components/seller/OverviewAnalytics';
import Link from 'next/link';

const SellerDashboard = () => {
    const { getToken, user } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [activeAnalytics, setActiveAnalytics] = useState('overview');

    useEffect(() => {
        // Any initialization logic can go here
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex-1 p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 md:p-8 bg-gray-50">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Seller Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Seller'}</p>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <Link href="/admin/products/add">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Add Product</h3>
                                    <p className="text-sm text-gray-500">Create with inventory tracking</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/products/manage-stock">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-cyan-500 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                                <div className="p-3 bg-cyan-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Manage Stock</h3>
                                    <p className="text-sm text-gray-500">Color-size inventory control</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/product-list">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Product List</h3>
                                    <p className="text-sm text-gray-500">View all products</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/orders">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Orders</h3>
                                    <p className="text-sm text-gray-500">View and manage orders</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/custom-designs">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Custom Designs</h3>
                                    <p className="text-sm text-gray-500">Manage design requests</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/add-product">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-gray-400 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center">
                                <div className="p-3 bg-gray-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Legacy Add Product</h3>
                                    <p className="text-sm text-gray-500">Old product form</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Inventory Management Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100">Total Products</p>
                                <p className="text-2xl font-bold">-</p>
                            </div>
                            <div className="text-blue-200">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100">Total Stock</p>
                                <p className="text-2xl font-bold">-</p>
                            </div>
                            <div className="text-green-200">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100">Low Stock Alerts</p>
                                <p className="text-2xl font-bold">-</p>
                            </div>
                            <div className="text-yellow-200">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100">Out of Stock</p>
                                <p className="text-2xl font-bold">-</p>
                            </div>
                            <div className="text-red-200">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
                    <div>
                        <button
                            onClick={() => setActiveAnalytics('overview')}
                            className={`px-4 py-2 mr-2 rounded ${activeAnalytics === 'overview' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveAnalytics('custom')}
                            className={`px-4 py-2 rounded ${activeAnalytics === 'custom' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Custom Designs
                        </button>
                    </div>
                </div>

                {/* Error Boundary Component */}
                <div className="analytics-component">
                    {activeAnalytics === 'overview' ? (
                        <OverviewAnalytics getToken={getToken} />
                    ) : (
                        <DesignAnalytics getToken={getToken} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/seller/product-list">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Products</h3>
                                    <p className="text-sm text-gray-500">Manage product listings</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/orders">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
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
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                            <div className="flex items-center">
                                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Custom Designs</h3>
                                    <p className="text-sm text-gray-500">Manage custom design requests</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/add-product">
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Add Product</h3>
                                    <p className="text-sm text-gray-500">Create new product listing</p>
                                </div>
                            </div>
                        </div>
                    </Link>
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
'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import DesignAnalytics from '@/components/seller/DesignAnalytics';
import OverviewAnalytics from '@/components/seller/OverviewAnalytics';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const SellerDashboard = () => {
    const { getToken, user } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [activeAnalytics, setActiveAnalytics] = useState('overview');
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        pendingOrders: 0,
        inTransitOrders: 0,
        deliveredOrders: 0,
        totalOrders: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const token = await getToken();

            const response = await axios.get('/api/seller/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStats(response.data.stats);
                console.log('✅ Stats fetched:', response.data.stats);
            } else {
                console.error('Failed to fetch stats:', response.data.message);
                toast.error('Failed to load inventory stats');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Error loading inventory stats');
        } finally {
            setStatsLoading(false);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-5 md:mb-6 max-w-full">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Seller Dashboard</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">Welcome back, {user?.name || 'Seller'}</p>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Quick Actions</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                    <Link href="/seller/add-product">
                        <div className="bg-gray-800 rounded-lg shadow-sm p-3 md:p-4 lg:p-5 border-l-4 border-purple-500 hover:shadow-lg transition-all cursor-pointer h-24 md:h-28 flex items-center justify-center">
                            <div className="flex flex-col items-center w-full text-center gap-1.5 md:gap-2">
                                <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-xs md:text-sm text-white font-medium">Add Product</h3>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/manage-inventory">
                        <div className="bg-gray-800 rounded-lg shadow-sm p-3 md:p-4 lg:p-5 border-l-4 border-cyan-500 hover:shadow-lg transition-all cursor-pointer h-24 md:h-28 flex items-center justify-center">
                            <div className="flex flex-col items-center w-full text-center gap-1.5 md:gap-2">
                                <div className="p-1.5 md:p-2 bg-cyan-100 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xs md:text-sm text-white font-medium">Manage Inventory</h3>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/orders">
                        <div className="bg-gray-800 rounded-lg shadow-sm p-3 md:p-4 lg:p-5 border-l-4 border-green-500 hover:shadow-lg transition-all cursor-pointer h-24 md:h-28 flex items-center justify-center">
                            <div className="flex flex-col items-center w-full text-center gap-1.5 md:gap-2">
                                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <h3 className="text-xs md:text-sm text-white font-medium">Orders</h3>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/custom-designs">
                        <div className="bg-gray-800 rounded-lg shadow-sm p-3 md:p-4 lg:p-5 border-l-4 border-orange-500 hover:shadow-lg transition-all cursor-pointer h-24 md:h-28 flex items-center justify-center">
                            <div className="flex flex-col items-center w-full text-center gap-1.5 md:gap-2">
                                <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xs md:text-sm text-white font-medium">Custom</h3>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Inventory Management Section */}
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Inventory Management</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                                <p className="text-xs text-blue-100 mb-1">Products</p>
                                <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.totalProducts}</p>
                            </div>
                            <div className="text-blue-200 ml-2">
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                                <p className="text-xs text-green-100 mb-1">Stock</p>
                                <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.totalStock}</p>
                            </div>
                            <div className="text-green-200 ml-2">
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                                <p className="text-xs text-yellow-100 mb-1">Low Stock</p>
                                <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.lowStockCount}</p>
                            </div>
                            <div className="text-yellow-200 ml-2">
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                                <p className="text-xs text-red-100 mb-1">Out Stock</p>
                                <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.outOfStockCount}</p>
                            </div>
                            <div className="text-red-200 ml-2">
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Status Section */}
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Order Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    <Link href="/seller/orders" className="block">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex-1">
                                    <p className="text-xs text-indigo-100 mb-1">Pending</p>
                                    <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.pendingOrders}</p>
                                </div>
                                <div className="text-indigo-200 ml-2">
                                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/orders" className="block">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex-1">
                                    <p className="text-xs text-orange-100 mb-1">In Transit</p>
                                    <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.inTransitOrders}</p>
                                </div>
                                <div className="text-orange-200 ml-2">
                                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/orders" className="block">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex-1">
                                    <p className="text-xs text-emerald-100 mb-1">Delivered</p>
                                    <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.deliveredOrders}</p>
                                </div>
                                <div className="text-emerald-200 ml-2">
                                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/orders" className="block">
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-3 md:p-4 h-24 md:h-28 flex items-center shadow-sm hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex-1">
                                    <p className="text-xs text-teal-100 mb-1">Total Orders</p>
                                    <p className="text-xl md:text-2xl font-bold">{statsLoading ? '...' : stats.totalOrders}</p>
                                </div>
                                <div className="text-teal-200 ml-2">
                                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3zM5 16a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Analytics */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-3">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">Analytics</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveAnalytics('overview')}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeAnalytics === 'overview' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveAnalytics('custom')}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${activeAnalytics === 'custom' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Custom
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
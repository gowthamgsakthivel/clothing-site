'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const OverviewAnalytics = ({ getToken }) => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [timeFrame, setTimeFrame] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchAnalytics();
    }, [timeFrame, refreshKey]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            let token = null;

            try {
                token = await getToken();
            } catch (tokenError) {
                console.error('Error getting token:', tokenError);
                toast.error('Authentication error');
                setLoading(false);
                return;
            }

            if (!token) {
                console.error('No token available');
                toast.error('Authentication error: No token available');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(
                    `/api/analytics/overview?timeFrame=${timeFrame}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                const { data } = response;

                if (data && data.success) {
                    setAnalytics(data.analytics);
                } else {
                    console.error('Failed to fetch analytics:', data?.message || 'No success data');
                    toast.error(`Failed to load analytics: ${data?.message || 'Unknown error'}`);
                }
            } catch (apiError) {
                console.error('API Error:', apiError.response?.data || apiError.message);
                toast.error(`API Error: ${apiError.response?.data?.message || apiError.message}`);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Format percentage
    const formatPercentage = (value) => {
        return `${Math.round(value * 10) / 10}%`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Sales Analytics</h2>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Sales Analytics</h2>
                    <button
                        onClick={handleRefresh}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Refresh
                    </button>
                </div>
                <div className="p-6 text-center">
                    <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 mb-4">
                        No analytics data available at the moment. This could be due to:
                    </p>
                    <ul className="text-left text-gray-500 max-w-md mx-auto mb-4">
                        <li className="mb-1">• No orders or custom designs yet</li>
                        <li className="mb-1">• A temporary server issue</li>
                        <li className="mb-1">• Authentication or permission issue</li>
                    </ul>
                    <div className="mt-6">
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Safely extract data from analytics with fallbacks for missing properties
    const summary = analytics?.summary || {
        totalOrders: 0,
        totalRegularOrders: 0,
        totalCustomDesigns: 0,
        totalRevenue: 0,
        totalRegularRevenue: 0,
        totalCustomRevenue: 0,
        percentageRegular: 0,
        percentageCustom: 0
    };

    const regularOrders = analytics?.regularOrders || {
        total: 0,
        statusCounts: {},
        revenue: { total: 0, average: 0, min: 0, max: 0 }
    };

    const customDesigns = analytics?.customDesigns || {
        total: 0,
        statusCounts: {},
        quoteStats: { totalQuoted: 0, averageQuote: 0, maxQuote: 0, minQuote: 0, totalQuoteValue: 0 }
    };

    const trends = analytics?.trends || { monthly: [] };

    // Prepare distribution chart data
    const distributionData = {
        labels: ['Regular Orders', 'Custom Designs'],
        datasets: [
            {
                data: [summary.totalRegularOrders || 0, summary.totalCustomDesigns || 0],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Prepare revenue chart data
    const revenueData = {
        labels: ['Regular Orders', 'Custom Designs'],
        datasets: [
            {
                data: [summary.totalRegularRevenue, summary.totalCustomRevenue],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Prepare monthly trends data - with safety checks for missing or malformed data
    const monthlyData = Array.isArray(trends.monthly) ? trends.monthly : [];

    const monthlyTrendsData = {
        labels: monthlyData.map(item => {
            try {
                // Validate year to ensure it's a reasonable value (between 2000 and current year + 1)
                const currentYear = new Date().getFullYear();
                const validYear = item.year >= 2000 && item.year <= currentYear + 1 ? item.year : currentYear;

                // Validate month (1-12)
                const validMonth = item.month >= 1 && item.month <= 12 ? item.month : 1;

                const monthName = new Date(validYear, validMonth - 1, 1)
                    .toLocaleString('default', { month: 'short' });
                return `${monthName} ${validYear}`;
            } catch (e) {
                console.error("Error formatting month label:", e);
                return "Unknown";
            }
        }),
        datasets: [
            {
                label: 'Regular Orders',
                data: monthlyData.map(item => item.regularOrders || 0),
                backgroundColor: 'rgba(54, 162, 235, 0.4)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.3,
                yAxisID: 'y',
            },
            {
                label: 'Custom Designs',
                data: monthlyData.map(item => item.customDesigns || 0),
                backgroundColor: 'rgba(255, 159, 64, 0.4)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                tension: 0.3,
                yAxisID: 'y',
            },
        ],
    };

    // Prepare revenue trends data - with safety checks
    const revenueTrendsData = {
        labels: monthlyData.map(item => {
            try {
                // Validate year to ensure it's a reasonable value (between 2000 and current year + 1)
                const currentYear = new Date().getFullYear();
                const validYear = item.year >= 2000 && item.year <= currentYear + 1 ? item.year : currentYear;

                // Validate month (1-12)
                const validMonth = item.month >= 1 && item.month <= 12 ? item.month : 1;

                const monthName = new Date(validYear, validMonth - 1, 1)
                    .toLocaleString('default', { month: 'short' });
                return `${monthName} ${validYear}`;
            } catch (e) {
                return "Unknown";
            }
        }),
        datasets: [
            {
                label: 'Regular Order Revenue',
                data: monthlyData.map(item => item.regularRevenue || 0),
                backgroundColor: 'rgba(75, 192, 192, 0.4)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.3,
                yAxisID: 'y',
            },
            {
                label: 'Custom Design Revenue',
                data: monthlyData.map(item => item.customRevenue || 0),
                backgroundColor: 'rgba(153, 102, 255, 0.4)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.3,
                yAxisID: 'y',
            },
        ],
    };

    // Chart options
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        cutout: '50%',
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Count'
                }
            }
        }
    };

    const revenueLineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'bottom'
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Revenue (₹)'
                }
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Sales Analytics</h2>

                <div className="flex items-center gap-2">
                    <select
                        value={timeFrame}
                        onChange={(e) => setTimeFrame(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 p-2"
                    >
                        <option value="all">All Time</option>
                        <option value="last7days">Last 7 Days</option>
                        <option value="last30days">Last 30 Days</option>
                        <option value="last90days">Last 90 Days</option>
                    </select>

                    <button
                        onClick={handleRefresh}
                        className="text-blue-600 hover:text-blue-800 flex items-center p-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="text-blue-600 text-xs font-medium uppercase tracking-wider mb-1">Total Orders</div>
                    <div className="text-2xl font-bold">{summary.totalOrders}</div>
                    <div className="text-sm text-gray-500 mt-1">
                        {summary.totalRegularOrders} regular + {summary.totalCustomDesigns} custom
                    </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="text-green-600 text-xs font-medium uppercase tracking-wider mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                        From all orders and custom designs
                    </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <div className="text-orange-600 text-xs font-medium uppercase tracking-wider mb-1">Regular Orders Revenue</div>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalRegularRevenue)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                        {formatPercentage(summary.percentageRegular)} of total orders
                    </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="text-purple-600 text-xs font-medium uppercase tracking-wider mb-1">Custom Design Revenue</div>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalCustomRevenue)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                        {formatPercentage(summary.percentageCustom)} of total orders
                    </div>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Distribution</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="h-64">
                            <Doughnut data={distributionData} options={doughnutOptions} />
                        </div>
                        <div className="mt-4 text-center">
                            <div className="text-sm text-gray-500">
                                Regular Orders: <span className="font-semibold">{summary.totalRegularOrders}</span> ({formatPercentage(summary.percentageRegular)})
                            </div>
                            <div className="text-sm text-gray-500">
                                Custom Designs: <span className="font-semibold">{summary.totalCustomDesigns}</span> ({formatPercentage(summary.percentageCustom)})
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Revenue Distribution</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="h-64">
                            <Doughnut data={revenueData} options={doughnutOptions} />
                        </div>
                        <div className="mt-4 text-center">
                            <div className="text-sm text-gray-500">
                                Regular Orders: <span className="font-semibold">{formatCurrency(summary.totalRegularRevenue)}</span> ({formatPercentage(summary.totalRevenue > 0 ? (summary.totalRegularRevenue / summary.totalRevenue) * 100 : 0)})
                            </div>
                            <div className="text-sm text-gray-500">
                                Custom Designs: <span className="font-semibold">{formatCurrency(summary.totalCustomRevenue)}</span> ({formatPercentage(summary.totalRevenue > 0 ? (summary.totalCustomRevenue / summary.totalRevenue) * 100 : 0)})
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Trends Charts */}
            {trends.monthly && trends.monthly.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Order Trends</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="h-80">
                            <Line data={monthlyTrendsData} options={lineOptions} />
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue Trends Chart */}
            {trends.monthly && trends.monthly.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Revenue Trends</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="h-80">
                            <Line data={revenueTrendsData} options={revenueLineOptions} />
                        </div>
                    </div>
                </div>
            )}

            {/* Regular Orders Stats */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Regular Orders Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Total Orders</div>
                        <div className="text-xl font-bold">{regularOrders.total}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Average Order Value</div>
                        <div className="text-xl font-bold">{formatCurrency(regularOrders.revenue.average || 0)}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Total Revenue</div>
                        <div className="text-xl font-bold">{formatCurrency(regularOrders.revenue.total || 0)}</div>
                    </div>
                </div>
            </div>

            {/* Custom Designs Stats */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Custom Designs Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Total Designs</div>
                        <div className="text-xl font-bold">{customDesigns.total}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Average Quote Value</div>
                        <div className="text-xl font-bold">{formatCurrency(customDesigns.quoteStats.averageQuote || 0)}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Total Quote Value</div>
                        <div className="text-xl font-bold">{formatCurrency(customDesigns.quoteStats.totalQuoteValue || 0)}</div>
                    </div>
                </div>
            </div>

            {/* Order Status */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Status Summary</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Regular Orders</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(regularOrders.statusCounts || {}).map(([status, count]) => (
                                    <div key={status} className="bg-white p-3 rounded border">
                                        <div className="text-xs text-gray-500">{status}</div>
                                        <div className="text-lg font-bold">{count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-700 mb-2">Custom Designs</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(customDesigns.statusCounts || {}).map(([status, count]) => (
                                    <div key={status} className="bg-white p-3 rounded border">
                                        <div className="text-xs text-gray-500">{status}</div>
                                        <div className="text-lg font-bold">{count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Data Table */}
            {trends.monthly && trends.monthly.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Data</h3>
                    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regular Orders</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regular Revenue</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom Designs</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom Revenue</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {trends.monthly.map((item, index) => {
                                    // Validate year to ensure it's a reasonable value (between 2000 and current year + 1)
                                    const currentYear = new Date().getFullYear();
                                    const validYear = item.year >= 2000 && item.year <= currentYear + 1 ? item.year : currentYear;

                                    // Validate month (1-12)
                                    const validMonth = item.month >= 1 && item.month <= 12 ? item.month : 1;

                                    // Create date with validated values
                                    const monthDate = new Date(validYear, validMonth - 1, 1);
                                    const monthName = monthDate.toLocaleString('default', { month: 'long' });
                                    const totalRevenue = item.regularRevenue + item.customRevenue;

                                    return (
                                        <tr key={index} className="hover:bg-gray-100">
                                            <td className="px-4 py-3 whitespace-nowrap">{monthName} {validYear}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.regularOrders}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(item.regularRevenue || 0)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.customDesigns}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(item.customRevenue || 0)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(totalRevenue || 0)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewAnalytics;
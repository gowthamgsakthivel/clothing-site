import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const DesignAnalytics = ({ getToken }) => {
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
            const token = await getToken();

            const response = await axios.get(
                `/api/custom-design/analytics?timeFrame=${timeFrame}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const { data } = response;

            if (data.success) {
                setAnalytics(data.analytics);
            } else {
                console.error('Failed to fetch analytics:', data.message);
                toast.error('Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Error loading analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const calculatePercentage = (count, total) => {
        if (!total) return 0;
        return Math.round((count / total) * 100);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Design Analytics</h2>
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
                    <h2 className="text-xl font-bold text-gray-800">Design Analytics</h2>
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
                <div className="p-4 text-center text-gray-500">
                    No analytics data available.
                </div>
            </div>
        );
    }

    const {
        totalRequests,
        statusCounts,
        quoteStats,
        sizeCounts,
        monthlyTrends,
        responseTimes,
        conversionRates
    } = analytics;

    // Prepare chart data
    const prepareStatusChartData = () => {
        const labels = Object.keys(statusCounts).map(status =>
            status.charAt(0).toUpperCase() + status.slice(1)
        );

        const data = Object.values(statusCounts);

        const backgroundColors = [
            'rgba(255, 205, 86, 0.6)',  // pending - yellow
            'rgba(54, 162, 235, 0.6)',   // quoted - blue
            'rgba(75, 192, 192, 0.6)',   // approved - green
            'rgba(255, 99, 132, 0.6)',   // rejected - red
            'rgba(153, 102, 255, 0.6)',  // completed - purple
        ];

        return {
            labels,
            datasets: [
                {
                    label: 'Design Requests',
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                    borderWidth: 1
                }
            ]
        };
    };

    const prepareMonthlyTrendsChartData = () => {
        if (!monthlyTrends || monthlyTrends.length === 0) {
            return null;
        }

        const labels = monthlyTrends.map(item => {
            const monthName = new Date(item.year, item.month - 1, 1).toLocaleString('default', { month: 'short' });
            return `${monthName} ${item.year}`;
        });

        const requestCounts = monthlyTrends.map(item => item.count);
        const averageQuotes = monthlyTrends.map(item => item.averageQuote || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'Design Requests',
                    data: requestCounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.4)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Average Quote (₹)',
                    data: averageQuotes,
                    backgroundColor: 'rgba(255, 159, 64, 0.4)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        };
    };

    const prepareSizeDistributionChartData = () => {
        if (!sizeCounts || sizeCounts.length === 0) {
            return null;
        }

        const labels = sizeCounts.map(size => size._id || 'N/A');
        const data = sizeCounts.map(size => size.count);

        const backgroundColors = [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(201, 203, 207, 0.6)'
        ];

        return {
            labels,
            datasets: [
                {
                    label: 'Size Distribution',
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                    borderWidth: 1
                }
            ]
        };
    };

    // Chart options
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
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
                    text: 'Number of Requests'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: 'Average Quote (₹)'
                }
            }
        }
    };

    const statusChartData = prepareStatusChartData();
    const monthlyTrendsChartData = prepareMonthlyTrendsChartData();
    const sizeDistributionChartData = prepareSizeDistributionChartData();

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Custom Design Analytics</h2>

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
                    <div className="text-blue-600 text-xs font-medium uppercase tracking-wider mb-1">Total Requests</div>
                    <div className="text-2xl font-bold">{totalRequests}</div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="text-green-600 text-xs font-medium uppercase tracking-wider mb-1">Completed Orders</div>
                    <div className="text-2xl font-bold">{statusCounts.completed}</div>
                    <div className="text-sm text-gray-500">{calculatePercentage(statusCounts.completed, totalRequests)}% completion rate</div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <div className="text-orange-600 text-xs font-medium uppercase tracking-wider mb-1">Average Quote</div>
                    <div className="text-2xl font-bold">{formatCurrency(quoteStats.averageQuote || 0)}</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="text-purple-600 text-xs font-medium uppercase tracking-wider mb-1">Response Time</div>
                    <div className="text-2xl font-bold">{responseTimes.averageResponseTime || 0} hours</div>
                </div>
            </div>

            {/* Status Distribution with Chart */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Status Distribution</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="flex-1 min-w-[100px]">
                                    <div className={`text-center p-3 rounded-lg ${status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                                            status === 'approved' ? 'bg-green-100 text-green-800' :
                                                status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                        }`}>
                                        <div className="text-xs font-semibold uppercase tracking-wider">{status}</div>
                                        <div className="text-xl font-bold mt-1">{count}</div>
                                        <div className="text-xs">{calculatePercentage(count, totalRequests)}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Distribution Chart */}
                    <div className="bg-gray-50 rounded-lg p-4 flex justify-center">
                        <div className="h-64 w-full">
                            <Pie data={statusChartData} options={pieOptions} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Trends Chart */}
            {monthlyTrendsChartData && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Trends</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="h-80">
                            <Line data={monthlyTrendsChartData} options={lineOptions} />
                        </div>
                    </div>
                </div>
            )}

            {/* Size Distribution Chart */}
            {sizeDistributionChartData && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Size Distribution</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="h-64">
                            <Bar data={sizeDistributionChartData} options={barOptions} />
                        </div>
                    </div>
                </div>
            )}

            {/* Quote Stats */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quote Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Total Quote Value</div>
                        <div className="text-xl font-bold">{formatCurrency(quoteStats.totalQuoteValue || 0)}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Lowest Quote</div>
                        <div className="text-xl font-bold">{formatCurrency(quoteStats.minQuote || 0)}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Highest Quote</div>
                        <div className="text-xl font-bold">{formatCurrency(quoteStats.maxQuote || 0)}</div>
                    </div>
                </div>
            </div>

            {/* Conversion Metrics */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Conversion Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Quote to Approval Rate</div>
                        <div className="text-xl font-bold">{conversionRates.quotedToApproved.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">Of quoted designs, this percentage were approved</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase font-medium mb-1">Overall Completion Rate</div>
                        <div className="text-xl font-bold">{conversionRates.totalToCompleted.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">Of all requests, this percentage were completed</div>
                    </div>
                </div>
            </div>

            {/* Monthly Trends Table (kept for reference) */}
            {monthlyTrends && monthlyTrends.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Data</h3>
                    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Quote</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {monthlyTrends.map((item, index) => {
                                    const monthName = new Date(item.year, item.month - 1, 1).toLocaleString('default', { month: 'long' });
                                    return (
                                        <tr key={index} className="hover:bg-gray-100">
                                            <td className="px-4 py-3 whitespace-nowrap">{monthName} {item.year}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.count}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(item.averageQuote || 0)}</td>
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

export default DesignAnalytics;
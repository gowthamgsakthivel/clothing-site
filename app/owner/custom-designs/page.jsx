'use client';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import SellerNegotiationResponse from '@/components/seller/SellerNegotiationResponse';
import NegotiationHistory from '@/components/NegotiationHistory';

const CustomDesignsPage = () => {
    const { getToken } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [designRequests, setDesignRequests] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalRequests: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeRequest, setActiveRequest] = useState(null);
    const [quoteForm, setQuoteForm] = useState({ amount: '', message: '' });
    const [responseForm, setResponseForm] = useState({ message: '' });
    const [convertingToOrder, setConvertingToOrder] = useState(false);

    const fetchDesignRequests = useCallback(async (page = 1, status = 'all') => {
        try {
            setLoading(true);
            const token = await getToken();

            const response = await axios.get(
                `/api/custom-design/seller?page=${page}&status=${status}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const { data } = response;

            if (data.success) {
                const requests = Array.isArray(data.designRequests) ? data.designRequests : [];
                setDesignRequests(requests);
                setPagination(data.pagination || {
                    page: 1,
                    limit: 10,
                    totalRequests: 0,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            } else {
                toast.error(data.message || 'Failed to fetch design requests');
                setDesignRequests([]);
            }
        } catch (error) {
            if (error.response) {
                toast.error(`Error ${error.response.status}: ${error.response.data?.message || 'Failed to fetch design requests'}`);
            } else if (error.request) {
                toast.error('Server did not respond. Please check your connection.');
            } else {
                toast.error('Failed to fetch design requests');
            }

            setDesignRequests([]);
            setPagination({
                page: 1,
                limit: 10,
                totalRequests: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            });
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    const submitQuote = async (designRequestId) => {
        if (!quoteForm.amount || isNaN(Number(quoteForm.amount)) || Number(quoteForm.amount) <= 0) {
            toast.error('Please enter a valid quote amount');
            return;
        }

        try {
            const token = await getToken();

            const { data } = await axios.post(
                '/api/custom-design/seller',
                {
                    designRequestId,
                    action: 'quote',
                    amount: Number(quoteForm.amount),
                    message: quoteForm.message
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (data.success) {
                toast.success('Quote submitted successfully');
                setActiveRequest(null);
                setQuoteForm({ amount: '', message: '' });
                fetchDesignRequests(pagination.page, filterStatus);
            } else {
                toast.error(data.message || 'Failed to submit quote');
            }
        } catch (error) {
            toast.error('Failed to submit quote');
        }
    };

    const submitResponse = async (designRequestId) => {
        if (!responseForm.message) {
            toast.error('Please enter a response message');
            return;
        }

        try {
            const token = await getToken();

            const { data } = await axios.post(
                '/api/custom-design/seller',
                {
                    designRequestId,
                    action: 'respond',
                    message: responseForm.message
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (data.success) {
                toast.success('Response submitted successfully');
                setActiveRequest(null);
                setResponseForm({ message: '' });
                fetchDesignRequests(pagination.page, filterStatus);
            } else {
                toast.error(data.message || 'Failed to submit response');
            }
        } catch (error) {
            toast.error('Failed to submit response');
        }
    };

    const updateRequestStatus = async (designRequestId, status) => {
        try {
            const token = await getToken();

            const { data } = await axios.post(
                '/api/custom-design/seller',
                {
                    designRequestId,
                    action: 'update_status',
                    status
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (data.success) {
                toast.success(`Status updated to ${status}`);
                setActiveRequest(null);
                fetchDesignRequests(pagination.page, filterStatus);
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const convertToOrder = async (designId) => {
        try {
            setConvertingToOrder(true);
            const token = await getToken();

            const { data } = await axios.post(
                '/api/custom-design/convert-to-order',
                { designId },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (data.success) {
                toast.success('Design converted to order successfully');
                fetchDesignRequests(pagination.page, filterStatus);

                setActiveRequest(prev => ({
                    ...prev,
                    status: 'completed',
                    orderId: data.order._id
                }));
            } else {
                toast.error(data.message || 'Failed to convert design to order');
            }
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data?.message || 'Failed to convert design to order');
            } else {
                toast.error('Failed to convert design to order. Please try again.');
            }
        } finally {
            setConvertingToOrder(false);
        }
    };

    const handleFilterChange = (e) => {
        const status = e.target.value;
        setFilterStatus(status);
        fetchDesignRequests(1, status);
    };

    const changePage = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            fetchDesignRequests(newPage, filterStatus);
        }
    };

    useEffect(() => {
        fetchDesignRequests(1, 'all');
    }, [fetchDesignRequests]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="w-full p-8 bg-gray-50">
            <h1 className="text-2xl font-bold mb-6">Custom Design Requests</h1>

            <div className="mb-6 flex flex-wrap items-center gap-4">
                <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                    <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                        <option value="all">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="quoted">Quoted</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <div className="ml-auto text-gray-500 text-sm">
                    {pagination.totalRequests} total requests
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            ) : designRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-lg text-gray-500">No custom design requests found</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Design
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Details
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {designRequests.map((request) => (
                                    <tr key={request._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-16 w-16 relative rounded overflow-hidden bg-gray-100">
                                                <Image
                                                    src={request.designImage}
                                                    alt="Design"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{request.name}</div>
                                            <div className="text-sm text-gray-500">{request.email}</div>
                                            <div className="text-sm text-gray-500">{request.phone}</div>
                                            {request.userInfo && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    User: {request.userInfo.name} ({request.userInfo.email})
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                <span className="font-medium">Size:</span> {request.size}
                                            </div>
                                            <div className="text-sm text-gray-900">
                                                <span className="font-medium">Quantity:</span> {request.quantity}
                                            </div>
                                            {request.preferredColor && (
                                                <div className="text-sm text-gray-900">
                                                    <span className="font-medium">Color:</span> {request.preferredColor}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    request.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                                                        request.status === 'negotiating' ? 'bg-indigo-100 text-indigo-800' :
                                                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </span>

                                                {request.customerResponse && request.customerResponse.message && (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                        Change Requested
                                                    </span>
                                                )}
                                            </div>

                                            {request.quote && request.quote.amount && (
                                                <div className="mt-2 text-sm text-gray-900">
                                                    <span className="font-medium">Quote:</span> ₹{request.quote.amount}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(request.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => setActiveRequest(request)}
                                                    className="text-orange-600 hover:text-orange-900 mr-4"
                                                >
                                                    View Details
                                                </button>
                                                <a
                                                    href={`/api/custom-design/download?designId=${request._id}`}
                                                    download
                                                    target="_blank"
                                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                                    title="Download Design"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <nav className="flex items-center space-x-2">
                                <button
                                    onClick={() => changePage(pagination.page - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className={`px-3 py-1 rounded-md ${pagination.hasPrevPage ? 'bg-white hover:bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                >
                                    Previous
                                </button>

                                {[...Array(pagination.totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => changePage(pageNumber)}
                                            className={`px-3 py-1 rounded-md ${pagination.page === pageNumber ? 'bg-orange-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => changePage(pagination.page + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className={`px-3 py-1 rounded-md ${pagination.hasNextPage ? 'bg-white hover:bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    )}
                </>
            )}

            {activeRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
                        <div className="flex justify-between items-center border-b p-6">
                            <h3 className="text-lg font-medium text-gray-900">Custom Design Request Details</h3>
                            <button
                                onClick={() => setActiveRequest(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:space-x-6">
                                <div className="md:w-1/2 mb-6 md:mb-0">
                                    <div className="relative h-72 w-full rounded-lg overflow-hidden bg-gray-100 border">
                                        <Image
                                            src={activeRequest.designImage}
                                            alt="Design"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>

                                    <div className="mt-2 flex justify-end">
                                        <a
                                            href={`/api/custom-design/download?designId=${activeRequest._id}`}
                                            download
                                            target="_blank"
                                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Download Design
                                        </a>
                                    </div>

                                    <div className="mt-4 border p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Status Management</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['pending', 'quoted', 'negotiating', 'approved', 'rejected', 'completed'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => updateRequestStatus(activeRequest._id, status)}
                                                    disabled={activeRequest.status === status}
                                                    className={`px-3 py-1 rounded text-sm font-medium ${activeRequest.status === status
                                                        ? 'bg-gray-200 text-gray-800 cursor-not-allowed'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                                        }`}
                                                >
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>

                                        {activeRequest.status === 'approved' && !activeRequest.orderId && (
                                            <div className="mt-4">
                                                <button
                                                    onClick={() => {
                                                        convertToOrder(activeRequest._id);
                                                    }}
                                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                >
                                                    {convertingToOrder ? 'Converting...' : 'Convert to Order'}
                                                </button>
                                                <p className="mt-2 text-xs text-gray-500">
                                                    This will create an order for the customer and mark this design as completed.
                                                </p>
                                            </div>
                                        )}

                                        {activeRequest.orderId && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                                <div className="flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <p className="ml-2 text-sm text-green-700 font-medium">
                                                        Order created successfully
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-xs text-green-600">
                                                    Order ID: {activeRequest.orderId}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="md:w-1/2">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Customer Name</h4>
                                            <p className="mt-1 text-sm text-gray-900">{activeRequest.name}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Date Submitted</h4>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(activeRequest.createdAt)}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Email</h4>
                                            <p className="mt-1 text-sm text-gray-900">{activeRequest.email}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                                            <p className="mt-1 text-sm text-gray-900">{activeRequest.phone}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Size</h4>
                                            <p className="mt-1 text-sm text-gray-900">{activeRequest.size}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Quantity</h4>
                                            <p className="mt-1 text-sm text-gray-900">{activeRequest.quantity}</p>
                                        </div>
                                        {activeRequest.preferredColor && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Preferred Color</h4>
                                                <p className="mt-1 text-sm text-gray-900">{activeRequest.preferredColor}</p>
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Current Status</h4>
                                            <p className="mt-1 text-sm text-gray-900">{activeRequest.status.charAt(0).toUpperCase() + activeRequest.status.slice(1)}</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-500">Design Description</h4>
                                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{activeRequest.description}</p>
                                    </div>

                                    {activeRequest.additionalNotes && (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
                                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{activeRequest.additionalNotes}</p>
                                        </div>
                                    )}

                                    {['pending', 'quoted'].includes(activeRequest.status) && (
                                        <div className="border p-4 rounded-lg mb-4">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                {activeRequest.status === 'quoted' ? 'Update Quote' : 'Provide Quote'}
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Quote Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={quoteForm.amount}
                                                        onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Message (Optional)</label>
                                                    <textarea
                                                        value={quoteForm.message}
                                                        onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                                                        rows="3"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                        placeholder="Additional details about the quote..."
                                                    ></textarea>
                                                </div>
                                                <button
                                                    onClick={() => submitQuote(activeRequest._id)}
                                                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                                >
                                                    {activeRequest.status === 'quoted' ? 'Update Quote' : 'Submit Quote'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Send Response to Customer</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Message</label>
                                                <textarea
                                                    value={responseForm.message}
                                                    onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                                                    rows="3"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    placeholder="Your response to the customer..."
                                                ></textarea>
                                            </div>
                                            <button
                                                onClick={() => submitResponse(activeRequest._id)}
                                                className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            >
                                                Send Response
                                            </button>
                                        </div>
                                    </div>

                                    {activeRequest.status === 'negotiating' && (
                                        <div className="mt-6">
                                            <SellerNegotiationResponse
                                                design={activeRequest}
                                                getToken={getToken}
                                                onResponseSubmitted={(updatedDesign) => {
                                                    setActiveRequest(prev => ({
                                                        ...prev,
                                                        ...updatedDesign
                                                    }));

                                                    fetchDesignRequests(pagination.page, filterStatus);
                                                }}
                                            />

                                            {activeRequest.negotiationHistory && activeRequest.negotiationHistory.length > 0 && (
                                                <div className="mt-4">
                                                    <NegotiationHistory
                                                        negotiationHistory={activeRequest.negotiationHistory}
                                                        initialQuote={activeRequest.quote}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeRequest.customerResponse && activeRequest.customerResponse.message && activeRequest.status !== 'negotiating' && (
                                        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                            <div className="flex items-center mb-1">
                                                <h4 className="font-medium text-gray-900">Customer Change Request</h4>
                                                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                                    Attention Required
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-line">{activeRequest.customerResponse.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Requested on {formatDate(activeRequest.customerResponse.timestamp)}
                                            </p>
                                        </div>
                                    )}

                                    {activeRequest.sellerResponse && activeRequest.sellerResponse.message && (
                                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-2">Previous Response</h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-line">{activeRequest.sellerResponse.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Sent on {formatDate(activeRequest.sellerResponse.timestamp)}
                                            </p>
                                        </div>
                                    )}

                                    {activeRequest.quote && activeRequest.quote.amount && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-medium text-gray-900 mb-2">Current Quote</h4>
                                            <p className="text-xl font-bold text-gray-900">₹{activeRequest.quote.amount}</p>
                                            {activeRequest.quote.message && (
                                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{activeRequest.quote.message}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Quoted on {formatDate(activeRequest.quote.timestamp)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t px-6 py-3 flex justify-end">
                            <button
                                onClick={() => setActiveRequest(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDesignsPage;

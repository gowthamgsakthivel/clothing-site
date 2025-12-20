'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';
import Link from 'next/link';
import QuoteResponseButtons from '@/components/QuoteResponseButtons';
import CustomDesignPaymentButton from '@/components/CustomDesignPaymentButton';
import NegotiationHistory from '@/components/NegotiationHistory';
import dynamic from 'next/dynamic';

const MyDesignsPage = () => {
    const { user, getToken, router } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [designRequests, setDesignRequests] = useState([]);
    const [activeRequest, setActiveRequest] = useState(null);
    const [notificationsChecked, setNotificationsChecked] = useState({});

    // Fetch user's design requests
    const fetchDesignRequests = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const response = await axios.get('/api/custom-design/list', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { data } = response;

            if (data.success) {
                // Ensure designRequests is always an array
                const requests = Array.isArray(data.designRequests) ? data.designRequests : [];
                setDesignRequests(requests);

                // Mark any new responses as unread
                const notificationState = {};
                requests.forEach(request => {
                    notificationState[request._id] = localStorage.getItem(`design_${request._id}_viewed`) === 'true';
                });
                setNotificationsChecked(notificationState);
            } else {
                console.error('API returned error:', data.message);
                toast.error(data.message || 'Failed to fetch design requests');
                setDesignRequests([]);
            }
        } catch (error) {
            console.error('Error fetching design requests:', error);
            console.error('Error details:', error.response?.data || 'No error details');
            toast.error('Failed to fetch your design requests. Please try again later.');
            setDesignRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // View request details and mark notification as read
    const viewRequestDetails = (request) => {
        setActiveRequest(request);

        // Mark as viewed in localStorage
        localStorage.setItem(`design_${request._id}_viewed`, 'true');
        setNotificationsChecked(prev => ({
            ...prev,
            [request._id]: true
        }));
    };

    // Format date string
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    useEffect(() => {
        if (user) {
            fetchDesignRequests();
        } else {
            // Redirect if not logged in
            router.push('/login');
        }
    }, [user]);

    // Check for new responses/updates
    const hasNewResponse = (request) => {
        return request.sellerResponse && !notificationsChecked[request._id];
    };

    // Get status label class
    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'quoted':
                return 'bg-blue-100 text-blue-800';
            case 'negotiating':
                return 'bg-indigo-100 text-indigo-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <SEOMetadata
                title="My Custom Design Requests | Sparrow Sports"
                description="View your custom t-shirt design requests and check seller responses, quotes, and order status."
                keywords="custom designs, t-shirt designs, design requests, custom apparel, my designs"
                url="/my-designs"
            />
            <Navbar />

            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Design Requests</h1>
                        <Link href="/custom-design">
                            <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                                New Design Request
                            </button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                        </div>
                    ) : designRequests.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <div className="text-5xl text-gray-300 mb-4">🖌️</div>
                            <h2 className="text-xl font-medium text-gray-700 mb-2">No Design Requests Yet</h2>
                            <p className="text-gray-500 mb-6">You haven't submitted any custom t-shirt design requests.</p>
                            <Link href="/custom-design">
                                <button className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                                    Create Your First Design
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {designRequests.map((request) => (
                                <div key={request._id} className="bg-white rounded-lg shadow overflow-hidden">
                                    {/* Payment Button components to ensure they're rendered in DOM */}
                                    {request.status === 'approved' && (
                                        <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} id={`payment-button-container-${request._id}`}>
                                            <CustomDesignPaymentButton
                                                design={request}
                                                text="Hidden Payment Button"
                                                variant="primary"
                                                size="md"
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row">
                                        {/* Design Image */}
                                        <div className="md:w-1/4 p-4 flex items-center justify-center bg-gray-50">
                                            <div className="relative h-40 w-40">
                                                {request.designImage ? (
                                                    <Image
                                                        src={request.designImage}
                                                        alt="Design"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded text-gray-400">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Request Details */}
                                        <div className="md:w-3/4 p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-lg font-medium text-gray-900">
                                                        Custom T-Shirt Design
                                                        {hasNewResponse(request) && (
                                                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                                New Response
                                                            </span>
                                                        )}
                                                        {request.isPriority && (
                                                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                                PRIORITY
                                                            </span>
                                                        )}
                                                        {request.advancePayment && request.advancePayment.amount > 0 && (
                                                            <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                ₹{request.advancePayment.amount} PAID
                                                            </span>
                                                        )}
                                                    </h2>
                                                    <p className="text-sm text-gray-500">
                                                        Submitted on {formatDate(request.createdAt)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(request.status)}`}>
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-500">Size:</span> {request.size}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-500">Quantity:</span> {request.quantity}
                                                </div>
                                                {request.preferredColor && (
                                                    <div>
                                                        <span className="font-medium text-gray-500">Preferred Color:</span> {request.preferredColor}
                                                    </div>
                                                )}
                                            </div>

                                            {request.quote && request.quote.amount && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-900">Quote: <span className="text-lg text-orange-600">₹{request.quote.amount}</span></p>
                                                    {request.quote.message && (
                                                        <p className="mt-1 text-sm text-gray-500">{request.quote.message}</p>
                                                    )}
                                                </div>
                                            )}

                                            {request.sellerResponse && request.sellerResponse.message && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-900">Seller Response:</p>
                                                    <p className="mt-1 text-sm text-gray-700">{request.sellerResponse.message.length > 100
                                                        ? `${request.sellerResponse.message.substring(0, 100)}...`
                                                        : request.sellerResponse.message}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-6 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => viewRequestDetails(request)}
                                                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                                                >
                                                    View Details
                                                </button>

                                                {/* Show payment button for approved designs that haven't been paid yet */}
                                                {request.status === 'approved' &&
                                                    (!request.advancePayment ||
                                                        !request.advancePayment.amount ||
                                                        request.advancePayment.amount <= 0) && (
                                                        <button
                                                            onClick={() => {
                                                                console.log('Pay Now button clicked for design:', request._id);

                                                                // First, try to find the button by specific ID (most reliable)
                                                                const specificButton = document.getElementById(`payment-button-${request._id}`);
                                                                if (specificButton) {
                                                                    console.log('Found payment button by ID, clicking it directly');
                                                                    specificButton.click();
                                                                    return;
                                                                }

                                                                // Second, try to find the container and button
                                                                const container = document.getElementById(`payment-button-container-${request._id}`);
                                                                if (container) {
                                                                    const button = container.querySelector('button[data-design-id]');
                                                                    if (button) {
                                                                        console.log('Found existing payment button in container, clicking it directly');
                                                                        button.click();
                                                                        return;
                                                                    }
                                                                }

                                                                // Third, use the global function
                                                                if (typeof window !== 'undefined' && window.showCustomDesignPayment) {
                                                                    console.log('Using global showCustomDesignPayment function');
                                                                    // Create a deep copy of the request to avoid any reference issues
                                                                    const designCopy = JSON.parse(JSON.stringify(request));
                                                                    window.showCustomDesignPayment(designCopy);
                                                                } else {
                                                                    // Last resort: Force render the payment button
                                                                    console.log('No payment methods found, creating one on the fly');

                                                                    // Add a temporary visible payment button directly to the DOM
                                                                    const tempContainer = document.createElement('div');
                                                                    tempContainer.id = `temp-payment-${request._id}`;
                                                                    tempContainer.style.position = 'fixed';
                                                                    tempContainer.style.top = '0';
                                                                    tempContainer.style.left = '0';
                                                                    tempContainer.style.width = '100%';
                                                                    tempContainer.style.height = '100%';
                                                                    tempContainer.style.zIndex = '9999';
                                                                    tempContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
                                                                    tempContainer.style.display = 'flex';
                                                                    tempContainer.style.justifyContent = 'center';
                                                                    tempContainer.style.alignItems = 'center';

                                                                    // Create loading message
                                                                    const messageDiv = document.createElement('div');
                                                                    messageDiv.style.backgroundColor = 'white';
                                                                    messageDiv.style.padding = '20px';
                                                                    messageDiv.style.borderRadius = '8px';
                                                                    messageDiv.style.maxWidth = '400px';
                                                                    messageDiv.innerHTML = '<h3 style="font-size: 18px; margin-bottom: 10px;">Loading Payment Options</h3><p>Please wait while we prepare the payment interface...</p>';
                                                                    tempContainer.appendChild(messageDiv);

                                                                    document.body.appendChild(tempContainer);

                                                                    // Store the design in session storage
                                                                    if (typeof window !== 'undefined') {
                                                                        sessionStorage.setItem('pendingPaymentDesign', JSON.stringify(request));
                                                                    }

                                                                    // Reload the page with the design ID as a query parameter
                                                                    setTimeout(() => {
                                                                        window.location.href = `/my-designs?pendingPayment=${request._id}`;
                                                                    }, 1000);
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                                                        >
                                                            Pay Now
                                                        </button>
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

            {/* Design request detail modal */}
            {activeRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0">
                        <div className="flex justify-between items-center border-b p-6">
                            <h3 className="text-lg font-medium text-gray-900">Design Request Details</h3>
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
                                {/* Left column - Design image */}
                                <div className="md:w-1/2 mb-6 md:mb-0">
                                    <div className="relative h-72 w-full rounded-lg overflow-hidden bg-gray-100 border">
                                        {activeRequest.designImage ? (
                                            <Image
                                                src={activeRequest.designImage}
                                                alt="Design"
                                                fill
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image Available
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-700">Status</h4>
                                        <div className="mt-2 flex items-center">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(activeRequest.status)}`}>
                                                {activeRequest.status.charAt(0).toUpperCase() + activeRequest.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right column - Request details */}
                                <div className="md:w-1/2">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Date Submitted</h4>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(activeRequest.createdAt)}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(activeRequest.updatedAt)}</p>
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

                                    {/* Quote Details */}
                                    {activeRequest.quote && activeRequest.quote.amount && (
                                        <div className="p-4 bg-blue-50 rounded-lg mb-4 border border-blue-100">
                                            <h4 className="font-medium text-gray-900 mb-2">Quote</h4>

                                            {activeRequest.status === 'quoted' || activeRequest.status === 'negotiating' ? (
                                                <QuoteResponseButtons
                                                    design={activeRequest}
                                                    getToken={getToken}
                                                    onQuoteResponded={(updatedDesign) => {
                                                        // Update the active request with all new data
                                                        setActiveRequest({
                                                            ...activeRequest,
                                                            ...updatedDesign
                                                        });

                                                        // Update the design in the list
                                                        const updatedList = designRequests.map(req =>
                                                            req._id === activeRequest._id
                                                                ? { ...req, ...updatedDesign }
                                                                : req
                                                        );
                                                        setDesignRequests(updatedList);
                                                    }}
                                                />
                                            ) : (
                                                <>
                                                    <p className="text-xl font-bold text-gray-900">₹{activeRequest.quote.amount}</p>
                                                    {activeRequest.quote.message && (
                                                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{activeRequest.quote.message}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Quoted on {formatDate(activeRequest.quote.timestamp)}
                                                    </p>

                                                    {/* Payment button for approved designs that haven't been paid yet */}
                                                    {activeRequest.status === 'approved' &&
                                                        (!activeRequest.advancePayment ||
                                                            !activeRequest.advancePayment.amount ||
                                                            activeRequest.advancePayment.amount <= 0) && (
                                                            <div className="mt-4 border-t pt-4">
                                                                <div className="bg-yellow-50 p-3 rounded-md mb-3 border border-yellow-100">
                                                                    <p className="text-sm text-yellow-700">
                                                                        <span className="font-medium">Payment Required:</span> Please complete your payment to begin production of your custom design.
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        // First close the current modal to prevent UI conflicts
                                                                        setActiveRequest(null);

                                                                        setTimeout(() => {
                                                                            console.log('Proceed to Payment button clicked for design:', activeRequest._id);

                                                                            // First, try to find the button by specific ID (most reliable)
                                                                            const specificButton = document.getElementById(`payment-button-${activeRequest._id}`);
                                                                            if (specificButton) {
                                                                                console.log('Found payment button by ID in detail view, clicking it directly');
                                                                                specificButton.click();
                                                                                return;
                                                                            }

                                                                            // Second, try to find the container and button
                                                                            const container = document.getElementById(`payment-button-container-${activeRequest._id}`);
                                                                            if (container) {
                                                                                const button = container.querySelector('button[data-design-id]');
                                                                                if (button) {
                                                                                    console.log('Found existing payment button in container from detail view, clicking it directly');
                                                                                    button.click();
                                                                                    return;
                                                                                }
                                                                            }

                                                                            // Third, render a new CustomDesignPaymentButton component directly
                                                                            const paymentContainer = document.createElement('div');
                                                                            paymentContainer.id = 'direct-payment-modal-container';
                                                                            paymentContainer.style.position = 'fixed';
                                                                            paymentContainer.style.top = '0';
                                                                            paymentContainer.style.left = '0';
                                                                            paymentContainer.style.width = '100%';
                                                                            paymentContainer.style.height = '100%';
                                                                            paymentContainer.style.zIndex = '9999';
                                                                            paymentContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
                                                                            paymentContainer.style.display = 'flex';
                                                                            paymentContainer.style.justifyContent = 'center';
                                                                            paymentContainer.style.alignItems = 'center';

                                                                            const modalContent = document.createElement('div');
                                                                            modalContent.style.backgroundColor = 'white';
                                                                            modalContent.style.borderRadius = '8px';
                                                                            modalContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                                                                            modalContent.style.width = '90%';
                                                                            modalContent.style.maxWidth = '600px';
                                                                            modalContent.style.padding = '20px';

                                                                            modalContent.innerHTML = `
                                                                                <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Payment Options</h2>
                                                                                <p>Loading payment interface for your custom design...</p>
                                                                                <div style="margin-top: 20px; display: flex; justify-content: center;">
                                                                                    <div style="width: 30px; height: 30px; border: 3px solid #f97316; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
                                                                                </div>
                                                                                <style>
                                                                                    @keyframes spin {
                                                                                        to { transform: rotate(360deg); }
                                                                                    }
                                                                                </style>
                                                                            `;

                                                                            paymentContainer.appendChild(modalContent);
                                                                            document.body.appendChild(paymentContainer);

                                                                            // Fourth, try global function with slight delay
                                                                            setTimeout(() => {
                                                                                if (window.showCustomDesignPayment) {
                                                                                    console.log('Using delayed global function for payment from detail view');
                                                                                    // Make a deep copy to avoid reference issues
                                                                                    const designCopy = JSON.parse(JSON.stringify(activeRequest));
                                                                                    window.showCustomDesignPayment(designCopy);

                                                                                    // Remove our temporary modal after delay
                                                                                    setTimeout(() => {
                                                                                        if (document.getElementById('direct-payment-modal-container')) {
                                                                                            document.getElementById('direct-payment-modal-container').remove();
                                                                                        }
                                                                                    }, 1000);
                                                                                } else {
                                                                                    // Last resort: refresh the page with query param
                                                                                    console.log('Global function not found, using page refresh fallback');
                                                                                    sessionStorage.setItem('pendingPaymentDesign', JSON.stringify(activeRequest));
                                                                                    window.location.href = `/my-designs?pendingPayment=${activeRequest._id}`;
                                                                                }
                                                                            }, 500);
                                                                        }, 100);
                                                                    }}
                                                                    className="proceed-to-payment w-full py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                                                >
                                                                    Proceed to Payment
                                                                </button>
                                                            </div>
                                                        )}
                                                </>
                                            )}

                                            {/* Show negotiation history if any exists */}
                                            {activeRequest.negotiationHistory && activeRequest.negotiationHistory.length > 0 && (
                                                <NegotiationHistory
                                                    negotiationHistory={activeRequest.negotiationHistory}
                                                    initialQuote={activeRequest.quote}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* Payment Information */}
                                    {activeRequest.advancePayment && activeRequest.advancePayment.amount > 0 && (
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-100 mb-4">
                                            <h4 className="font-medium text-gray-900 mb-2">Advance Payment</h4>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-lg font-bold text-green-600">₹{activeRequest.advancePayment.amount}</p>
                                                    <p className="text-sm text-gray-700">
                                                        Paid via {activeRequest.advancePayment.method} •
                                                        Status: <span className="font-medium">{activeRequest.advancePayment.status}</span>
                                                    </p>
                                                </div>
                                                {activeRequest.isPriority && (
                                                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-sm font-medium">
                                                        Priority Processing
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Payment made on {formatDate(activeRequest.advancePayment.timestamp)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Seller Response */}
                                    {activeRequest.sellerResponse && activeRequest.sellerResponse.message && (
                                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 mb-4">
                                            <h4 className="font-medium text-gray-900 mb-2">Seller Response</h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-line">{activeRequest.sellerResponse.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Responded on {formatDate(activeRequest.sellerResponse.timestamp)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Customer Response (for change requests) */}
                                    {activeRequest.customerResponse && activeRequest.customerResponse.message && (
                                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                            <h4 className="font-medium text-gray-900 mb-2">Your Change Request</h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-line">{activeRequest.customerResponse.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Requested on {formatDate(activeRequest.customerResponse.timestamp)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Next steps based on status */}
                            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>

                                {activeRequest.status === 'pending' && (
                                    <p className="text-sm text-gray-700">
                                        Your design request is currently being reviewed by our team. We'll provide a quote soon.
                                    </p>
                                )}

                                {activeRequest.status === 'quoted' && (
                                    <p className="text-sm text-gray-700">
                                        We've provided a quote for your design. Please review and accept it to proceed with production.
                                        You can also negotiate the price or request changes if needed.
                                    </p>
                                )}

                                {activeRequest.status === 'negotiating' && (
                                    <p className="text-sm text-gray-700">
                                        You've submitted a counter offer for this design. The seller will review your price and respond
                                        with an acceptance, rejection, or a new quote. Please check back soon for updates.
                                    </p>
                                )}

                                {activeRequest.status === 'approved' && (
                                    <p className="text-sm text-gray-700">
                                        Your design has been approved and is now in production. We'll update you when it's ready.
                                    </p>
                                )}

                                {activeRequest.status === 'rejected' && (
                                    <p className="text-sm text-gray-700">
                                        Unfortunately, we couldn't proceed with your design request. Please check the seller's response
                                        for details or submit a new design.
                                    </p>
                                )}

                                {activeRequest.status === 'completed' && (
                                    <p className="text-sm text-gray-700">
                                        Your custom design order has been completed! If you have any questions about your order,
                                        please contact us.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="border-t px-6 py-3 flex justify-end">
                            <button
                                onClick={() => setActiveRequest(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default MyDesignsPage;
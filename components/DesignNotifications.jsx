'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const DesignNotifications = () => {
    const { user, getToken } = useAppContext();
    const [designRequests, setDesignRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Fetch user's design requests to check for notifications
    const fetchDesignRequests = useCallback(async (retryCount = 0) => {
        if (!user) return;

        try {
            setLoading(true);
            const token = await getToken();

            console.log("Fetching design requests with token...");

            // Set timeout for the request (reduced from 10s to 6s to handle slow APIs better)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

            // Robust error handling with detailed logging
            const response = await axios.get('/api/custom-design/list', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                },
                timeout: 5000, // 5 second timeout (reduced from 8s)
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log("API response received:", response.status);
            const { data } = response;

            if (data.success) {
                console.log(`Design requests found: ${data.designRequests?.length || 0}`);
                // Always ensure designRequests is an array
                const requests = Array.isArray(data.designRequests) ? data.designRequests : [];
                setDesignRequests(requests);

                // Check for unread notifications
                checkForUnreadNotifications(requests);
            } else {
                console.error('API returned error:', data.message);
                // Set empty array to avoid undefined errors
                setDesignRequests([]);

                // Show error toast only on first attempt
                if (retryCount === 0) {
                    toast.error(data.message || 'Failed to fetch design requests');
                }
            }
        } catch (error) {
            console.error('Error fetching design notifications:', error);

            // Handle different error types
            let errorMessage = 'Unknown error occurred';
            let shouldRetry = false;

            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                errorMessage = 'Request timeout - server took too long to respond';
                shouldRetry = true;
            } else if (error.response) {
                // Server responded with error
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);

                if (error.response.status >= 500) {
                    errorMessage = 'Server error - please try again';
                    shouldRetry = true;
                } else if (error.response.status === 401) {
                    errorMessage = 'Authentication required - please sign in again';
                } else {
                    errorMessage = error.response.data?.message || 'Server error occurred';
                }
            } else if (error.request) {
                // Request was made but no response
                console.error('No response received:', error.request);
                errorMessage = 'Network error - unable to connect to server';
                shouldRetry = true;
            } else {
                // Error in setting up the request
                console.error('Error setting up request:', error.message);
                errorMessage = error.message;
            }

            // Retry logic for network errors
            if (shouldRetry && retryCount < 2) {
                console.log(`Retrying request (attempt ${retryCount + 1})`);
                setTimeout(() => {
                    fetchDesignRequests(retryCount + 1);
                }, 2000 * (retryCount + 1)); // Exponential backoff
            } else {
                // Show error toast only if all retries failed
                if (retryCount === 0 || !shouldRetry) {
                    toast.error(errorMessage);
                }
            }

            // Set empty array to avoid undefined errors
            setDesignRequests([]);
        } finally {
            // Only set loading to false if this is not a retry
            if (retryCount === 0) {
                setLoading(false);
            }
        }
    }, [getToken, user]);

    // Check for unread notifications
    const checkForUnreadNotifications = (requests) => {
        let hasUnread = false;

        requests.forEach(request => {
            // Check if there's a seller response and if it's been viewed
            if (request.sellerResponse && request.sellerResponse.message) {
                const viewed = localStorage.getItem(`design_${request._id}_viewed`) === 'true';
                if (!viewed) {
                    hasUnread = true;
                }
            }

            // Also check if there's a new quote
            if (request.quote && request.quote.amount) {
                const viewed = localStorage.getItem(`quote_${request._id}_viewed`) === 'true';
                if (!viewed) {
                    hasUnread = true;
                }
            }
        });

        setHasUnreadNotifications(hasUnread);
    };

    // Mark notification as read
    const markAsRead = (requestId, type = 'design') => {
        localStorage.setItem(`${type}_${requestId}_viewed`, 'true');

        // Recheck for unread notifications
        checkForUnreadNotifications(designRequests);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Toggle notification panel
    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    // Get unread notifications
    const getUnreadNotifications = () => {
        const notifications = [];

        designRequests.forEach(request => {
            // Check for unread seller responses
            if (request.sellerResponse && request.sellerResponse.message) {
                const viewed = localStorage.getItem(`design_${request._id}_viewed`) === 'true';
                if (!viewed) {
                    notifications.push({
                        id: `design_${request._id}`,
                        requestId: request._id,
                        type: 'response',
                        message: 'New response to your design request',
                        date: request.sellerResponse.timestamp,
                        status: request.status
                    });
                }
            }

            // Check for unread quotes
            if (request.quote && request.quote.amount) {
                const viewed = localStorage.getItem(`quote_${request._id}_viewed`) === 'true';
                if (!viewed) {
                    notifications.push({
                        id: `quote_${request._id}`,
                        requestId: request._id,
                        type: 'quote',
                        message: `Quote received: ₹${request.quote.amount}`,
                        date: request.quote.timestamp,
                        status: request.status
                    });
                }
            }
        });

        // Sort by date (newest first)
        return notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    useEffect(() => {
        if (user) {
            fetchDesignRequests();
        } else {
            // Clear data if user is not logged in
            setDesignRequests([]);
            setHasUnreadNotifications(false);
        }

        // Check for notifications every minute (only if user is logged in)
        const interval = setInterval(() => {
            if (user && !loading) {
                fetchDesignRequests();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [user, loading, fetchDesignRequests]);

    if (!user || loading) return null;

    const unreadNotifications = getUnreadNotifications();

    return (
        <div className="relative">
            {/* Notification bell icon */}
            <button
                onClick={toggleNotifications}
                className="relative p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="Notifications"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Notification badge */}
                {hasUnreadNotifications && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
            </button>

            {/* Notification panel */}
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
                    <div className="py-2 px-3 bg-gray-100 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                            {unreadNotifications.length > 0 && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    {unreadNotifications.length} New
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {unreadNotifications.length === 0 ? (
                            <div className="py-4 px-3 text-sm text-gray-500 text-center">
                                No new notifications
                            </div>
                        ) : (
                            <div>
                                {unreadNotifications.map(notification => (
                                    <Link
                                        key={notification.id}
                                        href="/my-designs"
                                        onClick={() => markAsRead(notification.requestId, notification.type === 'quote' ? 'quote' : 'design')}
                                    >
                                        <div className="py-3 px-4 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                                <p className="text-xs text-gray-500">{formatDate(notification.date)}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Status: {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="py-2 px-3 bg-gray-50 text-xs text-center border-t">
                        <Link href="/my-designs">
                            <span className="text-orange-600 hover:text-orange-800">View all design requests</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignNotifications;
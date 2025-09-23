"use client"
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Loading from '@/components/Loading';
import SEOMetadata from '@/components/SEOMetadata';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Notifications = () => {
    const { user, router, getToken } = useAppContext();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect if not logged in
        if (!user) {
            router.push('/sign-in');
            return;
        }

        // Fetch user's notifications
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/user/notifications', {
                    headers: {
                        Authorization: `Bearer ${await getToken()}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    setNotifications(data.notifications || []);
                } else {
                    console.error('Failed to fetch notifications:', data.message);
                    toast.error('Failed to load notifications');
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
                toast.error('Error loading notifications');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchNotifications();
        }
    }, [user, getToken, router]);

    const handleRemoveNotification = async (productId, color, size) => {
        try {
            const toastId = toast.loading('Removing notification...');

            const response = await fetch('/api/user/notifications/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await getToken()}`
                },
                body: JSON.stringify({
                    productId,
                    color,
                    size
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update local state
                setNotifications(prevNotifications =>
                    prevNotifications.filter(notification =>
                        !(notification.productId === productId &&
                            notification.color === color &&
                            notification.size === size)
                    )
                );
                toast.success('Notification removed successfully', { id: toastId });
            } else {
                toast.error(data.message || 'Failed to remove notification', { id: toastId });
            }
        } catch (error) {
            console.error('Error removing notification:', error);
            toast.error('Failed to remove notification');
        }
    };

    return (
        <>
            <SEOMetadata
                title="Stock Notifications"
                description="Manage your stock notifications for out-of-stock items at Sparrow Sports"
                keywords="notifications, stock alerts, sparrow sports, athletic wear, out of stock"
                url="/notifications"
            />
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 pt-14 pb-16 min-h-[calc(100vh-200px)]">
                <h1 className="text-3xl font-medium mb-8">My Stock Notifications</h1>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loading />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-medium text-gray-700 mb-3">No Stock Notifications</h2>
                        <p className="text-gray-500 mb-6">You haven't subscribed to any out-of-stock item notifications.</p>
                        <button
                            onClick={() => router.push('/all-products')}
                            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <p className="text-gray-600">You will receive a notification when these products are back in stock.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notifications.map((notification, index) => (
                                <div key={index} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center p-4 bg-gray-50">
                                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center mr-4">
                                            {notification.productImage ? (
                                                <Image
                                                    src={notification.productImage}
                                                    alt={notification.productName || 'Product image'}
                                                    width={80}
                                                    height={80}
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-xs">No image</div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-medium truncate">{notification.productName || 'Product'}</h3>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {notification.color && (
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-4 h-4 rounded-full mr-1"
                                                            style={{ backgroundColor: notification.color }}
                                                        ></div>
                                                        <span className="text-xs text-gray-600">{notification.color}</span>
                                                    </div>
                                                )}
                                                {notification.size && (
                                                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                                        Size: {notification.size}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                ₹{notification.price || '-'}
                                            </p>
                                            {notification.date && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Requested on: {format(new Date(notification.date), 'MMM dd, yyyy')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-3 flex justify-between border-t">
                                        <button
                                            onClick={() => router.push(`/product/${notification.productId}`)}
                                            className="text-sm text-blue-600 hover:text-blue-800 transition"
                                        >
                                            View Product
                                        </button>
                                        <button
                                            onClick={() => handleRemoveNotification(
                                                notification.productId,
                                                notification.color,
                                                notification.size
                                            )}
                                            className="text-sm text-red-600 hover:text-red-800 transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default Notifications;
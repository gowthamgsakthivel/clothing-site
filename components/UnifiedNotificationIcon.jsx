"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import toast from 'react-hot-toast';

const UnifiedNotificationIcon = () => {
    const { user, getToken, router } = useAppContext();
    const [stockNotificationCount, setStockNotificationCount] = useState(0);
    const [designNotificationCount, setDesignNotificationCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchAllNotifications = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const token = await getToken();

            // Fetch stock notifications
            const stockResponse = await fetch('/api/user/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const stockData = await stockResponse.json();
            if (stockData.success) {
                setStockNotificationCount(stockData.notifications?.length || 0);
            }

            // Fetch design notifications
            try {
                const designResponse = await fetch('/api/custom-design/list', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const designData = await designResponse.json();
                if (designData.success) {
                    const unreadDesigns = designData.designs?.filter(design =>
                        design.status === 'quoted' ||
                        design.status === 'negotiating' ||
                        design.status === 'approved'
                    ) || [];
                    setDesignNotificationCount(unreadDesigns.length);
                }
            } catch (designError) {
                // Design notifications are optional, don't break if they fail
                console.log('Design notifications unavailable');
                setDesignNotificationCount(0);
            }

        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [getToken, user]);

    useEffect(() => {
        if (user) {
            fetchAllNotifications();
        }
    }, [user, fetchAllNotifications]);

    const totalNotifications = stockNotificationCount + designNotificationCount;

    const handleClick = () => {
        if (!user) {
            toast.error('Please sign in to view notifications');
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

        // Navigate to notifications page which can show both types
        router.push('/notifications');
    };

    return (
        <div onClick={handleClick} className="relative cursor-pointer">
            <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Image
                    src={assets.notification_icon}
                    alt="Notifications"
                    width={20}
                    height={20}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                />
            </div>

            {totalNotifications > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {totalNotifications > 9 ? '9+' : totalNotifications}
                </div>
            )}

            {/* Tooltip showing breakdown */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {totalNotifications > 0 ? (
                    <div>
                        {stockNotificationCount > 0 && <div>Stock: {stockNotificationCount}</div>}
                        {designNotificationCount > 0 && <div>Designs: {designNotificationCount}</div>}
                    </div>
                ) : (
                    'No notifications'
                )}
            </div>
        </div>
    );
};

export default UnifiedNotificationIcon;
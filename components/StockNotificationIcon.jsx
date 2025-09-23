"use client";
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import toast from 'react-hot-toast';

const StockNotificationIcon = () => {
    const { user, getToken, router } = useAppContext();
    const [notificationCount, setNotificationCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notification count when user loads
    useEffect(() => {
        if (user) {
            fetchNotificationCount();
        }
    }, [user]);

    const fetchNotificationCount = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const token = await getToken();

            const response = await fetch('/api/user/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // Count notifications
                setNotificationCount(data.notifications?.length || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = () => {
        if (!user) {
            toast.error('Please sign in to view notifications');
            setTimeout(() => router.push('/sign-in'), 1500);
            return;
        }

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

            {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </div>
            )}
        </div>
    );
};

export default StockNotificationIcon;
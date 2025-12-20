"use client";
import React from 'react';
import DesignNotifications from './DesignNotifications';
import StockNotificationIcon from './StockNotificationIcon';

const NotificationCenter = () => {
    return (
        <div className="flex items-center gap-1">
            {/* Stock Notifications - Blue Bell */}
            <div className="relative group">
                <div className="p-1">
                    <StockNotificationIcon />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Stock Alerts
                </div>
            </div>

            {/* Design Notifications - Orange Bell */}
            <div className="relative group">
                <div className="p-1">
                    <DesignNotifications />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Design Updates
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
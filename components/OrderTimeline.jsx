'use client';

import React from 'react';

const OrderTimeline = ({ status, createdAt, updatedAt }) => {
    const statuses = [
        { key: 'Order Placed', icon: '📝', desc: 'Order confirmed' },
        { key: 'Processing', icon: '⚙️', desc: 'Preparing items' },
        { key: 'Shipped', icon: '📦', desc: 'Package dispatched' },
        { key: 'Out for Delivery', icon: '🚚', desc: 'On the way' },
        { key: 'Delivered', icon: '✅', desc: 'Order completed' }
    ];

    const cancelledStatuses = ['Cancelled', 'Returned'];
    const isCancelled = cancelledStatuses.includes(status);

    // Find current status index
    const currentIndex = statuses.findIndex(s => s.key === status);
    const activeIndex = currentIndex >= 0 ? currentIndex : 0;

    if (isCancelled) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl">
                        {status === 'Cancelled' ? '❌' : '↩️'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-900">{status}</h3>
                        <p className="text-sm text-red-700">
                            {status === 'Cancelled' ? 'Order has been cancelled' : 'Order has been returned'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {statuses.map((step, index) => {
                const isCompleted = index <= activeIndex;
                const isCurrent = index === activeIndex;

                return (
                    <div key={step.key} className="flex items-start gap-4">
                        {/* Timeline Line */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition ${
                                    isCompleted
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-400'
                                } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                            >
                                {step.icon}
                            </div>
                            {index < statuses.length - 1 && (
                                <div
                                    className={`w-0.5 h-16 transition ${
                                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-2">
                            <h4
                                className={`font-semibold ${
                                    isCompleted ? 'text-gray-900' : 'text-gray-400'
                                }`}
                            >
                                {step.key}
                            </h4>
                            <p
                                className={`text-sm ${
                                    isCompleted ? 'text-gray-600' : 'text-gray-400'
                                }`}
                            >
                                {step.desc}
                            </p>
                            {isCurrent && (
                                <p className="text-xs text-green-600 mt-1 font-medium">
                                    Current Status
                                </p>
                            )}
                        </div>

                        {/* Timestamp */}
                        <div className="text-right">
                            {isCompleted && (
                                <p className="text-xs text-gray-500">
                                    {index === 0
                                        ? new Date(createdAt).toLocaleString('en-IN', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                          })
                                        : isCurrent
                                        ? new Date(updatedAt).toLocaleString('en-IN', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                          })
                                        : ''}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderTimeline;

import React from 'react';

const NegotiationHistory = ({ negotiationHistory = [], initialQuote }) => {
    // If no history or empty array, return null
    if (!negotiationHistory || negotiationHistory.length === 0) {
        return null;
    }

    // Sort history by timestamp (oldest first)
    const sortedHistory = [...negotiationHistory].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return (
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 py-2 px-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">Negotiation History</h3>
            </div>

            <div className="divide-y divide-gray-200">
                {/* Initial quote */}
                {initialQuote && (
                    <div className="p-4 bg-blue-50">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-blue-800 font-medium">Initial Quote</span>
                                <p className="text-sm text-gray-600 mt-1">
                                    {initialQuote.message || "No message provided"}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">₹{initialQuote.amount}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(initialQuote.timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Negotiation entries */}
                {sortedHistory.map((entry, index) => (
                    <div
                        key={index}
                        className={`p-4 ${entry.offerBy === 'customer'
                            ? 'bg-gray-50'
                            : 'bg-orange-50'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`${entry.offerBy === 'customer'
                                        ? 'text-blue-600'
                                        : 'text-orange-600'
                                    } font-medium`}>
                                    {entry.offerBy === 'customer' ? 'You' : 'Seller'}
                                </span>
                                {entry.message && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {entry.message}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">₹{entry.amount}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(entry.timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Current status */}
            <div className="bg-gray-50 py-2 px-4 border-t border-gray-200 text-center text-sm text-gray-600">
                The current offer is ₹{
                    sortedHistory.length > 0
                        ? sortedHistory[sortedHistory.length - 1].amount
                        : (initialQuote ? initialQuote.amount : 'N/A')
                }
            </div>
        </div>
    );
};

export default NegotiationHistory;
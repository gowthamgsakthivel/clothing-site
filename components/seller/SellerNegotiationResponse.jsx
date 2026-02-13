import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import NegotiationHistory from '../NegotiationHistory';

const SellerNegotiationResponse = ({ design, getToken, onResponseSubmitted }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCounterOfferForm, setShowCounterOfferForm] = useState(false);
    const [counterOfferAmount, setCounterOfferAmount] = useState('');
    const [counterOfferMessage, setCounterOfferMessage] = useState('');
    const [rejectMessage, setRejectMessage] = useState('');

    // Get the last customer counter offer
    const getLastCustomerOffer = () => {
        if (!design.negotiationHistory || design.negotiationHistory.length === 0) {
            return null;
        }

        // Filter for customer offers and sort by timestamp (newest first)
        const customerOffers = design.negotiationHistory
            .filter(entry => entry.offerBy === 'customer')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return customerOffers.length > 0 ? customerOffers[0] : null;
    };

    const lastCustomerOffer = getLastCustomerOffer();

    // Handle seller's response to the negotiation
    const handleNegotiationResponse = async (response) => {
        try {
            setIsSubmitting(true);
            console.log(`Responding to customer counter offer with: ${response}`);

            const token = await getToken();

            // Build the payload based on response type
            let payload = {
                designId: design._id,
                response: response
            };

            if (response === 'counter') {
                if (!counterOfferAmount || parseFloat(counterOfferAmount) <= 0) {
                    toast.error('Please enter a valid counter offer amount');
                    setIsSubmitting(false);
                    return;
                }

                payload.newQuote = parseFloat(counterOfferAmount);
                payload.message = counterOfferMessage || `New quote: ₹${counterOfferAmount}`;
            } else if (response === 'reject') {
                payload.message = rejectMessage || 'We cannot accept your counter offer.';
            } else if (response === 'accept') {
                payload.message = 'We accept your counter offer.';
            }

            console.log("Sending API request with payload:", payload);
            const { data } = await axios.post(
                '/api/custom-design/seller-respond',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                console.log("Response submitted successfully:", data.message);
                toast.success(data.message);

                // Reset form state
                setShowCounterOfferForm(false);
                setCounterOfferAmount('');
                setCounterOfferMessage('');
                setRejectMessage('');

                // Call the callback to update the design in the parent component
                if (typeof onResponseSubmitted === 'function') {
                    onResponseSubmitted(data.designRequest);
                }
            } else {
                console.error("API returned error:", data.message);
                toast.error(data.message || 'Failed to submit response');
            }
        } catch (error) {
            console.error('Error responding to negotiation:', error);
            console.error('Error details:', error.response?.data);
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Current negotiation status */}
            {lastCustomerOffer && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Counter Offer</h4>

                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-700">
                                The customer has proposed a counter offer:
                            </p>
                            {lastCustomerOffer.message && (
                                <p className="mt-1 text-sm text-gray-700 font-medium italic">
                                    &quot;{lastCustomerOffer.message}&quot;
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">₹{lastCustomerOffer.amount}</div>
                            <div className="text-xs text-gray-500">
                                Original quote: ₹{design.quote.amount}
                            </div>
                        </div>
                    </div>

                    {/* Show negotiation history if any exists */}
                    {design.negotiationHistory && design.negotiationHistory.length > 0 && (
                        <div className="mt-4">
                            <NegotiationHistory
                                negotiationHistory={design.negotiationHistory}
                                initialQuote={design.quote}
                            />
                        </div>
                    )}

                    {/* Response buttons */}
                    {!showCounterOfferForm && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={() => handleNegotiationResponse('accept')}
                                disabled={isSubmitting}
                                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isSubmitting ? 'Processing...' : 'Accept Counter Offer'}
                            </button>

                            <button
                                onClick={() => setShowCounterOfferForm(true)}
                                disabled={isSubmitting}
                                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                Make New Offer
                            </button>

                            {!rejectMessage ? (
                                <button
                                    onClick={() => setRejectMessage('We cannot accept your counter offer.')}
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                        }`}
                                >
                                    Reject Counter Offer
                                </button>
                            ) : (
                                <div className="w-full mt-2">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={rejectMessage}
                                                onChange={(e) => setRejectMessage(e.target.value)}
                                                placeholder="Message for rejection (optional)"
                                                className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-red-500 focus:border-red-500"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleNegotiationResponse('reject')}
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            Confirm Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Counter offer form */}
                    {showCounterOfferForm && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Make a New Offer
                            </h4>

                            <div className="mb-3">
                                <label className="block text-sm text-gray-700 mb-1">Your New Offer (₹)</label>
                                <input
                                    type="number"
                                    value={counterOfferAmount}
                                    onChange={(e) => setCounterOfferAmount(e.target.value)}
                                    placeholder="Enter your counter offer amount"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    min="1"
                                    required
                                />
                                <p className="mt-1 text-xs text-blue-600">
                                    Customer&apos;s offer: ₹{lastCustomerOffer.amount} | Original quote: ₹{design.quote.amount}
                                </p>
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm text-gray-700 mb-1">Message (Optional)</label>
                                <textarea
                                    value={counterOfferMessage}
                                    onChange={(e) => setCounterOfferMessage(e.target.value)}
                                    placeholder="Explain your new offer (optional)"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                />
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => handleNegotiationResponse('counter')}
                                    disabled={isSubmitting || !counterOfferAmount || parseFloat(counterOfferAmount) <= 0}
                                    className={`px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${(isSubmitting || !counterOfferAmount || parseFloat(counterOfferAmount) <= 0)
                                        ? 'opacity-70 cursor-not-allowed'
                                        : ''
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit New Offer'}
                                </button>

                                <button
                                    onClick={() => setShowCounterOfferForm(false)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SellerNegotiationResponse;
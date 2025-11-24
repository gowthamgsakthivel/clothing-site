import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import CustomDesignPaymentModal from './CustomDesignPaymentModal';

const QuoteResponseButtons = ({ design, getToken, onQuoteResponded }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showChangeRequestForm, setShowChangeRequestForm] = useState(false);
    const [showNegotiationForm, setShowNegotiationForm] = useState(false);
    const [changeRequestMessage, setChangeRequestMessage] = useState('');
    const [counterOfferAmount, setCounterOfferAmount] = useState('');  // Keep as string for input field
    const [negotiationMessage, setNegotiationMessage] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [approvedDesign, setApprovedDesign] = useState(null);

    const handleQuoteResponse = async (response, message = null) => {
        try {
            setIsSubmitting(true);
            console.log(`Responding to quote for design ${design._id} with response: ${response}`);
            const payload = {
                designId: design._id,
                response: response,
                message: message
            };

            console.log("Sending API request with payload:", payload);
            const { data } = await axios.post(
                '/api/custom-design/respond-to-quote',
                payload
            );
            console.log("API response:", data);

            if (data.success) {
                if (response === 'accepted') {
                    console.log("Quote accepted, showing payment modal");
                    // Store the updated design and show payment modal
                    const updatedDesign = { ...design, status: 'approved', ...data.designRequest };
                    console.log("Setting approved design:", updatedDesign);
                    setApprovedDesign(updatedDesign);

                    // Always show payment modal when quote is accepted
                    console.log("Opening payment modal");
                    setShowPaymentModal(true);
                    toast.success('Quote accepted! Please complete your payment to proceed with production.');

                    // Also notify through the callback
                    if (typeof onQuoteResponded === 'function') {
                        console.log("Calling onQuoteResponded callback");
                        onQuoteResponded(data.designRequest);
                    }
                } else {
                    // For rejected/change request
                    console.log("Quote rejected or change requested");
                    toast.success('Change request submitted successfully.');

                    // Call the callback to refresh the design data
                    if (typeof onQuoteResponded === 'function') {
                        onQuoteResponded(data.designRequest);
                    }
                }
            } else {
                console.error("API returned error:", data.message);
                toast.error(data.message || 'Failed to process your request');
            }
        } catch (error) {
            console.error('Error responding to quote:', error);
            console.error('Error details:', error.response?.data);
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
            setShowChangeRequestForm(false);
        }
    };

    const formatDeliveryDate = (daysFromNow = 7) => {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    // Handle negotiation submission
    const handleNegotiation = async () => {
        // Make sure we have a valid counter offer amount
        const offerAmount = parseFloat(counterOfferAmount);
        if (isNaN(offerAmount) || offerAmount <= 0) {
            toast.error('Please enter a valid counter offer amount');
            return;
        }

        try {
            setIsSubmitting(true);
            console.log(`Sending counter offer of ₹${offerAmount} for design ${design._id}`);
            // Ensure all data is valid and in the correct format
            const payload = {
                designId: design._id,
                response: 'negotiate', // This matches the API's expected value
                counterOffer: offerAmount, // Ensure this is a valid number
                message: negotiationMessage || '' // Ensure this is at least an empty string
            };

            console.log("Sending negotiation API request with payload:", payload);
            const { data } = await axios.post(
                '/api/custom-design/respond-to-quote',
                payload
            );

            if (data.success) {
                console.log("Negotiation submitted successfully");
                toast.success('Your counter offer has been submitted to the seller.');

                // Update UI state
                setShowNegotiationForm(false);

                // Call the callback to refresh the design data
                if (typeof onQuoteResponded === 'function') {
                    onQuoteResponded(data.designRequest);
                }
            } else {
                console.error("API returned error:", data.message);
                toast.error(data.message || 'Failed to submit counter offer');
            }
        } catch (error) {
            console.error('Error submitting counter offer:', error);
            console.error('Error details:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to submit counter offer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Quote information display */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xl font-bold text-gray-900">₹{design.quote.amount}</p>

                <p className="mt-2 text-sm text-gray-700">
                    Will be delivered on {formatDeliveryDate()}
                </p>

                {design.quote.message && (
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                        {design.quote.message}
                    </p>
                )}

                <p className="text-xs text-gray-500 mt-2">
                    Quoted on {new Date(design.quote.timestamp).toLocaleDateString()}
                </p>
            </div>

            {/* Response buttons */}
            {design.status === 'quoted' && !showChangeRequestForm && !showNegotiationForm && (
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => handleQuoteResponse('accepted')}
                        disabled={isSubmitting}
                        className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {isSubmitting ? 'Processing...' : 'Accept Quote and Pay'}
                    </button>

                    <button
                        onClick={() => setShowNegotiationForm(true)}
                        disabled={isSubmitting}
                        className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        Negotiate Price
                    </button>

                    <button
                        onClick={() => setShowChangeRequestForm(true)}
                        disabled={isSubmitting}
                        className={`px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        Request Changes
                    </button>
                </div>
            )}

            {/* Change request form */}
            {showChangeRequestForm && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        What changes would you like to request?
                    </h4>

                    <textarea
                        value={changeRequestMessage}
                        onChange={(e) => setChangeRequestMessage(e.target.value)}
                        placeholder="Please specify the changes you'd like (price, delivery time, design details, etc.)"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        rows={4}
                        required
                    />

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => handleQuoteResponse('rejected', changeRequestMessage)}
                            disabled={isSubmitting || !changeRequestMessage.trim()}
                            className={`px-4 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 ${(isSubmitting || !changeRequestMessage.trim()) ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>

                        <button
                            onClick={() => setShowChangeRequestForm(false)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Negotiation form */}
            {showNegotiationForm && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">
                        Make a Counter Offer
                    </h4>

                    <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">Your Counter Offer (₹)</label>
                        <input
                            type="number"
                            value={counterOfferAmount}
                            onChange={(e) => {
                                // Validate to ensure it's a positive number
                                const value = e.target.value;
                                if (value === '' || (parseFloat(value) > 0 && !isNaN(parseFloat(value)))) {
                                    setCounterOfferAmount(value);
                                }
                            }}
                            placeholder="Enter your counter offer amount"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                            step="1"
                            required
                        />
                        <p className="mt-1 text-xs text-blue-600">Current quote: ₹{design.quote.amount}</p>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">Message (Optional)</label>
                        <textarea
                            value={negotiationMessage}
                            onChange={(e) => setNegotiationMessage(e.target.value)}
                            placeholder="Explain why you're requesting this price (optional)"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                        />
                    </div>

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleNegotiation}
                            disabled={isSubmitting || !counterOfferAmount || parseFloat(counterOfferAmount) <= 0}
                            className={`px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${(isSubmitting || !counterOfferAmount || parseFloat(counterOfferAmount) <= 0) ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Counter Offer'}
                        </button>

                        <button
                            onClick={() => setShowNegotiationForm(false)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Payment modal for accepted quotes */}
            {showPaymentModal && approvedDesign ? (
                <div className="fixed inset-0 z-50">
                    {console.log("Rendering payment modal for design:", approvedDesign._id)}
                    <CustomDesignPaymentModal
                        design={approvedDesign}
                        onClose={() => {
                            console.log("Payment modal closed");
                            setShowPaymentModal(false);
                        }}
                        onPaymentComplete={(order) => {
                            // Update the design with order information if needed
                            console.log("Payment completed with order:", order);
                            toast.success('Payment completed! You can track your order in My Orders.');
                            setShowPaymentModal(false);

                            // Redirect to My Orders page after a short delay
                            console.log("Redirecting to My Orders page in 1.5 seconds");
                            setTimeout(() => {
                                window.location.href = '/my-orders';
                            }, 1500);
                        }}
                    />
                </div>
            ) : showPaymentModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                            <p className="text-lg">Loading payment options...</p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default QuoteResponseButtons;
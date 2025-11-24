import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';

const CustomDesignPaymentModal = ({ design, onClose, onPaymentComplete }) => {
    const { getToken } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');

    // Verify design prop on mount
    useEffect(() => {
        console.log('CustomDesignPaymentModal mounted with design:', design?._id ? `ID: ${design._id}` : 'missing ID!');

        if (!design || !design._id) {
            console.error('Invalid design data passed to payment modal:', design);
            toast.error('Error: Invalid design data');
            if (onClose) {
                setTimeout(onClose, 2000);
            }
            return;
        }

        // Ensure modal is visible with an additional class on the body
        document.body.classList.add('modal-open');

        // After a short delay, set isLoading to false
        setTimeout(() => {
            setIsLoading(false);

            // Check if modal is visible
            const modalElement = document.querySelector('.fixed.inset-0.z-\\[100\\]');
            console.log('Modal element check after timeout:', modalElement ? 'Found' : 'Not found');

            // Force modal visibility
            if (modalElement) {
                // Add inline styles to ensure visibility
                modalElement.style.display = 'flex';
                modalElement.style.visibility = 'visible';
                modalElement.style.opacity = '1';
                modalElement.style.pointerEvents = 'auto';
            }
        }, 300);

        // Clean up by removing body class when component unmounts
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [design, onClose]);

    useEffect(() => {
        // Check if we have RazorPay available
        console.log('Loading Razorpay script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => console.log('Razorpay script loaded successfully');
        script.onerror = () => console.error('Error loading Razorpay script');
        document.body.appendChild(script);

        // Add a class to the body to indicate modal is open
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        // Log that the modal is open for debugging
        console.log('Payment modal opened and added modal-open class to body');

        // Add CSS to ensure modal is visible (in case of CSS conflicts)
        const styleEl = document.createElement('style');
        styleEl.id = 'payment-modal-styles';
        styleEl.textContent = `
            .fixed.inset-0.z-\\[100\\] {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                pointer-events: auto !important;
            }
            body.modal-open {
                overflow: hidden;
            }
        `;
        document.head.appendChild(styleEl);

        return () => {
            // Check if the script exists before trying to remove it
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            // Remove body class
            document.body.classList.remove('modal-open');
            document.body.style.overflow = ''; // Restore scrolling

            // Remove our custom styles
            const styleElement = document.getElementById('payment-modal-styles');
            if (styleElement) {
                styleElement.remove();
            }

            console.log('Payment modal closed and cleaned up body classes');
        };
    }, []);

    const handleCodPayment = async () => {
        try {
            setIsLoading(true);
            console.log('Starting COD payment process for design:', design._id);
            console.log('Sending API request for COD payment');

            const { data } = await axios.post(
                '/api/custom-design/convert-to-order',
                {
                    designId: design._id,
                    paymentMethod: 'COD',
                    paymentStatus: 'Pending'
                }
            );

            console.log('API response:', data);
            if (data.success) {
                toast.success('Order placed successfully! You can track it in My Orders.');
                console.log('Order created successfully:', data.order);

                if (typeof onPaymentComplete === 'function') {
                    onPaymentComplete(data.order);
                }

                // Ensure we redirect to my-orders page with a clear message
                toast.success('Redirecting to My Orders page...');

                // Store the order ID in localStorage to highlight it on the orders page
                if (data.order && data.order._id) {
                    localStorage.setItem('last_placed_order', data.order._id);
                    localStorage.setItem('order_placement_time', Date.now());
                }

                // Redirect after a short delay to allow toast to be seen
                setTimeout(() => {
                    console.log('Redirecting to My Orders page');
                    window.location.href = '/my-orders';
                }, 1500);

                onClose();
            } else {
                console.error('API returned error:', data.message);
                toast.error(data.message || 'Failed to place order');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error placing order:', error);
            console.error('Error details:', error.response?.data);
            toast.error(error.response?.data?.message || 'Something went wrong');
            setIsLoading(false);
        }
    };

    const handleRazorpayPayment = async () => {
        try {
            setIsLoading(true);
            console.log('Starting Razorpay payment process for design:', design._id);

            // Check if Razorpay script is loaded
            if (!window.Razorpay) {
                console.error('Razorpay script not loaded');
                toast.error('Payment gateway not available. Please try again later.');
                setIsLoading(false);
                return;
            }

            console.log('Creating Razorpay order');

            // First create the Razorpay order (amount must be in paisa, so multiply by 100)
            const orderResponse = await axios.post(
                '/api/razorpay/order',
                {
                    amount: design.quote.amount * 100,
                    currency: 'INR',
                    receipt: `custom_design_${design._id}`
                }
            );

            console.log('Razorpay order API response:', orderResponse.data);

            if (!orderResponse.data.success) {
                throw new Error(orderResponse.data.message || 'Failed to create payment order');
            }

            const { order } = orderResponse.data;
            console.log('Razorpay order created:', order.id);

            // Initialize Razorpay payment
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Sparrow Sports',
                description: 'Custom T-Shirt Design Payment',
                order_id: order.id,
                handler: async (response) => {
                    try {
                        console.log('Payment successful, verifying payment');
                        console.log('Payment response:', response);

                        // Verify the payment
                        const verifyResponse = await axios.post(
                            '/api/razorpay/verify',
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        );

                        console.log('Payment verification response:', verifyResponse.data);

                        if (verifyResponse.data.success) {
                            // Create the order with the payment details
                            console.log('Payment verified, creating order for design:', design._id);
                            const orderResult = await axios.post(
                                '/api/custom-design/convert-to-order',
                                {
                                    designId: design._id,
                                    paymentMethod: 'Razorpay',
                                    paymentStatus: 'Paid',
                                    paymentDetails: {
                                        orderId: response.razorpay_order_id,
                                        paymentId: response.razorpay_payment_id,
                                        signature: response.razorpay_signature
                                    }
                                }
                            );

                            console.log('Convert to order API response:', orderResult.data);
                            if (orderResult.data.success) {
                                toast.success('Payment successful! Order placed successfully.');
                                console.log('Order created successfully:', orderResult.data.order);
                                if (typeof onPaymentComplete === 'function') {
                                    onPaymentComplete(orderResult.data.order);
                                }
                                // Always ensure we redirect to the orders page
                                toast.success('Redirecting to My Orders page...');
                                setTimeout(() => {
                                    window.location.href = '/my-orders';
                                }, 1500);
                                onClose();
                            } else {
                                console.error('API returned error:', orderResult.data.message);
                                toast.error(orderResult.data.message || 'Payment was successful but order creation failed.');
                            }
                        } else {
                            toast.error(verifyResponse.data.message || 'Payment verification failed');
                        }
                    } catch (verifyError) {
                        console.error('Payment verification error:', verifyError);
                        console.error('Error details:', verifyError.response?.data);
                        toast.error('Payment was processed but verification failed. Please contact support.');
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log('Razorpay modal dismissed');
                        toast.error('Payment canceled or dismissed');
                        setIsLoading(false);
                    }
                },
                prefill: {
                    name: design.name || '',
                    email: design.email || '',
                    contact: design.phone || ''
                },
                theme: {
                    color: '#f97316'
                }
            };

            console.log('Opening Razorpay payment form');
            setIsLoading(false);

            // Open Razorpay payment form
            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', function (response) {
                console.error('Payment failed:', response.error);
                toast.error(`Payment failed: ${response.error.description}`);
            });

            paymentObject.open();
            console.log('Razorpay payment form opened');

        } catch (error) {
            setIsLoading(false);
            console.error('Error initializing payment:', error);
            console.error('Error details:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to initialize payment');
        }
    };

    // If design is invalid, show error
    if (!design || !design._id) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                <div className="bg-white rounded-lg shadow-xl p-6 text-center relative z-10 max-w-md w-full mx-4">
                    <div className="text-red-500 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Payment</h3>
                    <p className="text-gray-600 mb-4">Unable to load payment details. Please try again.</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn">
            <div className="fixed inset-0 bg-black bg-opacity-60" onClick={onClose}></div>
            <div className="bg-white rounded-lg shadow-2xl relative z-[101] max-w-md w-full mx-4">
                {/* Header with close button */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Complete Your Payment</h3>
                    <button
                        onClick={() => {
                            console.log("Close button clicked");
                            if (typeof onClose === 'function') {
                                onClose();
                            }
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading payment options...</p>
                        </div>
                    ) : (
                        <>
                            {/* Design summary */}
                            <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
                                {/* Design Image */}
                                <div className="relative h-16 w-16 flex-shrink-0">
                                    {design.designImage ? (
                                        <Image
                                            src={design.designImage}
                                            alt="Design"
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                                            <span className="text-gray-400">No image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Design details */}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{design.designName || 'Custom T-Shirt Design'}</p>
                                    <p className="text-sm text-gray-500">Size: {design.size || 'Standard'}</p>
                                    <p className="text-sm text-gray-500">Color: {design.color || 'As specified'}</p>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                    <p className="font-semibold text-orange-600">₹{(design.quote && design.quote.amount) || '--'}</p>
                                    <p className="text-xs text-gray-500">Incl. taxes</p>
                                </div>
                            </div>

                            {/* Payment options */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Select Payment Method</h4>

                                <div className="space-y-2">
                                    {/* Razorpay option */}
                                    <div
                                        className={`border rounded-lg p-3 cursor-pointer ${paymentMethod === 'razorpay' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                                        onClick={() => setPaymentMethod('razorpay')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'razorpay' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                                                    {paymentMethod === 'razorpay' && (
                                                        <div className="w-2 h-2 rounded-full bg-white m-auto"></div>
                                                    )}
                                                </div>
                                                <span className="ml-2 text-gray-900">Pay Online (Card, UPI, etc.)</span>
                                            </div>
                                            <div className="text-sm text-gray-500">Secure Payment</div>
                                        </div>
                                    </div>

                                    {/* COD option */}
                                    <div
                                        className={`border rounded-lg p-3 cursor-pointer ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                                        onClick={() => setPaymentMethod('cod')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                                                    {paymentMethod === 'cod' && (
                                                        <div className="w-2 h-2 rounded-full bg-white m-auto"></div>
                                                    )}
                                                </div>
                                                <span className="ml-2 text-gray-900">Cash on Delivery</span>
                                            </div>
                                            <div className="text-sm text-gray-500">Pay when delivered</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total and pay button */}
                            <div>
                                <div className="flex justify-between items-center font-medium mb-4">
                                    <span className="text-gray-900">Total Amount:</span>
                                    <span className="text-xl text-orange-600">₹{(design.quote && design.quote.amount) || '--'}</span>
                                </div>

                                <button
                                    onClick={paymentMethod === 'razorpay' ? handleRazorpayPayment : handleCodPayment}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="inline-block animate-spin mr-2">⟳</span>
                                            Processing...
                                        </>
                                    ) : (
                                        `Pay Now${paymentMethod === 'cod' ? ' (Cash on Delivery)' : ''}`
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center mt-2">
                                    By proceeding, you agree to our terms and conditions
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomDesignPaymentModal;
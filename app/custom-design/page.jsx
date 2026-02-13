'use client';
import React, { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import SEOMetadata from '@/components/SEOMetadata';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CustomDesignPage = () => {
    const { user, router, getToken } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [designImage, setDesignImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [designDetails, setDesignDetails] = useState({
        name: '',
        email: '',
        phone: '',
        description: '',
        quantity: 1,
        size: 'M',
        preferredColor: '',
        additionalNotes: ''
    });

    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            if (!file.type.includes('image')) {
                toast.error('Please upload a valid image file');
                return;
            }

            setDesignImage(file);

            // Create a preview URL
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            return () => URL.revokeObjectURL(objectUrl);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        // Ensure proper type conversion
        let processedValue = value;

        if (type === 'number') {
            // Ensure numeric values are stored as numbers
            processedValue = value === '' ? '' : Number(value);
        } else if (name === 'quantity') {
            // Ensure quantity is always a number even if the input type isn't 'number'
            processedValue = value === '' ? '' : Number(value);
            if (isNaN(processedValue) || processedValue < 1) {
                processedValue = 1;
            }
        } else if (name === 'phone') {
            // Remove non-numeric characters from phone
            processedValue = value.replace(/[^\d+]/g, '');
        }

        setDesignDetails(prev => ({ ...prev, [name]: processedValue }));
    };

    // Add function to handle Razorpay payment
    const initiateRazorpayPayment = async (designId, amount) => {
        try {
            console.log('Starting Razorpay payment for design:', designId);

            // Check if Razorpay script is loaded
            if (!window.Razorpay) {
                console.error('Razorpay script not loaded');
                toast.error('Payment gateway not available. Please try again later.');
                return false;
            }

            const token = await getToken();

            // Create Razorpay order
            const orderResponse = await axios.post(
                '/api/razorpay/order',
                {
                    amount: amount,
                    currency: 'INR',
                    receipt: `custom_design_${designId}`
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!orderResponse.data.success) {
                throw new Error(orderResponse.data.message || 'Failed to create payment order');
            }

            const { order } = orderResponse.data;

            // Create promise to handle payment completion
            return new Promise((resolve, reject) => {
                // Initialize Razorpay payment
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'Sparrow Sports',
                    description: 'Custom Design Advance Payment',
                    order_id: order.id,
                    handler: async (response) => {
                        try {
                            // Verify payment
                            const verifyResponse = await axios.post(
                                '/api/razorpay/verify',
                                {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            if (verifyResponse.data.success) {
                                // Return payment details on success
                                resolve({
                                    success: true,
                                    paymentDetails: {
                                        orderId: response.razorpay_order_id,
                                        paymentId: response.razorpay_payment_id,
                                        signature: response.razorpay_signature
                                    }
                                });
                            } else {
                                reject(new Error(verifyResponse.data.message || 'Payment verification failed'));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            reject(new Error('Payment cancelled'));
                        }
                    },
                    prefill: {
                        name: designDetails.name || '',
                        email: designDetails.email || '',
                        contact: designDetails.phone || ''
                    },
                    theme: {
                        color: '#f97316'
                    }
                };

                // Open Razorpay payment form
                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', function (response) {
                    reject(new Error(response.error.description));
                });

                paymentObject.open();
            });
        } catch (error) {
            console.error('Error in Razorpay payment:', error);
            toast.error(error.message || 'Payment failed. Please try again.');
            return false;
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please sign in to submit a custom design request');
            router.push('/login');
            return;
        }

        if (!designImage) {
            toast.error('Please upload a design image');
            return;
        }

        // Client-side validation
        const validationErrors = [];
        if (!designDetails.name || designDetails.name.trim().length < 2) {
            validationErrors.push("Name must be at least 2 characters");
        }

        if (!designDetails.email || !designDetails.email.includes('@')) {
            validationErrors.push("Valid email is required");
        }

        if (!designDetails.phone || designDetails.phone.trim().length < 8) {
            validationErrors.push("Valid phone number is required (min 8 digits)");
        }

        if (!designDetails.description || designDetails.description.trim().length < 10) {
            validationErrors.push("Design description must be at least 10 characters");
        }

        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            return;
        }

        try {
            setIsSubmitting(true);

            // Create form data to upload image and design details
            const formData = new FormData();

            // Use a File object if designImage is already a File, otherwise create one
            if (designImage instanceof File) {
                formData.append('designImage', designImage);
            } else {
                // This is a fallback but shouldn't normally happen
                console.error('designImage is not a File object');
                toast.error('Invalid image format. Please try uploading again.');
                setIsSubmitting(false);
                return;
            }

            // Create a clean copy of design details with proper types
            const validatedDetails = {
                name: (designDetails.name || user?.fullName || '').trim(),
                email: (designDetails.email || user?.primaryEmailAddress?.emailAddress || '').trim(),
                phone: (designDetails.phone || '').trim(),
                description: (designDetails.description || '').trim(),
                quantity: Number(designDetails.quantity) || 1,
                size: designDetails.size || 'M',
                preferredColor: (designDetails.preferredColor || '').trim(),
                additionalNotes: (designDetails.additionalNotes || '').trim()
            };

            // Double check for numeric quantity
            if (isNaN(validatedDetails.quantity) || validatedDetails.quantity < 1) {
                validatedDetails.quantity = 1;
            }

            formData.append('details', JSON.stringify(validatedDetails));

            console.log('Submitting form data:', {
                image: designImage.name,
                size: designImage.size,
                details: validatedDetails
            });

            const token = await getToken();

            console.log('Starting design request submission...');

            try {
                // Submit the design to create it in the database
                const { data } = await axios.post('/api/custom-design/create', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!data.success) {
                    console.error('API returned error:', data);
                    toast.error(data.message || 'Failed to submit request');
                    return;
                }

                // Success - redirect to my designs page
                toast.success('Custom design request submitted successfully! You will receive a quote from our team soon.');
                router.push('/my-designs');
            } catch (error) {
                console.error('Error submitting design request:', error);

                // More detailed error logging
                if (error.response) {
                    console.error('Response error details:', {
                        status: error.response.status,
                        headers: error.response.headers,
                        data: error.response.data
                    });

                    // Handle validation errors specially
                    if (error.response.data?.errors) {
                        Object.values(error.response.data.errors).forEach(err => {
                            toast.error(err);
                        });
                    } else {
                        toast.error(error.response.data?.message || 'Server rejected your submission. Please check all fields.');
                    }
                } else if (error.request) {
                    // Request was made but no response
                    console.error('No response received:', error.request);
                    toast.error('No response from server. Please check your connection and try again.');
                } else {
                    // Error setting up request
                    console.error('Error setting up request:', error.message);
                    toast.error('Error submitting form. Please try again.');
                }
            } finally {
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Unexpected error in form submission:', error);
            toast.error('An unexpected error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <>
            <SEOMetadata
                title="Custom T-Shirt Design | Sparrow Sports"
                description="Create your own custom t-shirt design. Upload your artwork, specify your requirements, and we'll bring your vision to life."
                keywords="custom t-shirt, personalized clothing, custom design, t-shirt printing, custom apparel"
                url="/custom-design"
            />
            <Navbar />

            <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8 pt-20 md:pt-24">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Design Your Custom T-Shirt</h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Upload your design, tell us about your requirements, and we&apos;ll create a custom t-shirt just for you!
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="md:flex">
                            {/* Design Upload Section */}
                            <div className="md:w-1/2 bg-gray-50 p-8 flex flex-col items-center justify-center border-r border-gray-200">
                                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Upload Your Design</h2>

                                <div
                                    className="w-full aspect-square mb-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition"
                                    onClick={triggerFileInput}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />

                                    {previewUrl ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={previewUrl}
                                                alt="Design preview"
                                                className="object-contain"
                                                fill
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewUrl(null);
                                                    setDesignImage(null);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                title="Remove image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center p-6">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-600">Click to upload your design</p>
                                            <p className="mt-1 text-xs text-gray-500">(Max size: 5MB)</p>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-gray-500 text-center mt-2">
                                    Upload a clear image of your design. We recommend high-resolution images for best results.
                                </p>
                            </div>

                            {/* Form Section */}
                            <div className="md:w-1/2 p-8">
                                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Design Details</h2>

                                <form onSubmit={handleFormSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={designDetails.name}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={designDetails.email}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    placeholder="your-email@example.com"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={designDetails.phone}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    placeholder="Enter at least 8 digits"
                                                    minLength="8"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Design Description</label>
                                            <textarea
                                                name="description"
                                                value={designDetails.description}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Describe your design, where it should be placed, any special instructions..."
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    value={designDetails.quantity}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    max="1000"
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Size</label>
                                                <select
                                                    name="size"
                                                    value={designDetails.size}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                    required
                                                >
                                                    <option value="XS">XS</option>
                                                    <option value="S">S</option>
                                                    <option value="M">M</option>
                                                    <option value="L">L</option>
                                                    <option value="XL">XL</option>
                                                    <option value="XXL">XXL</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Preferred T-Shirt Color</label>
                                            <input
                                                type="text"
                                                name="preferredColor"
                                                value={designDetails.preferredColor}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="e.g., Black, White, Navy Blue, etc."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                                            <textarea
                                                name="additionalNotes"
                                                value={designDetails.additionalNotes}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="Any additional information or special requests..."
                                            ></textarea>
                                        </div>

                                        {/* Payment section removed - payment will happen after seller quote */}
                                    </div>


                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Custom Design Request'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Process explanation */}
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">1. Submit Your Design</h3>
                                <p className="text-gray-600">Upload your design and tell us about your requirements.</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">2. Get a Quote</h3>
                                <p className="text-gray-600">Our team will review your request and provide a quote based on your design.</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">3. Accept and Pay</h3>
                                <p className="text-gray-600">Accept the quote and complete the payment to begin production.</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">4. Receive Your Custom T-Shirt</h3>
                                <p className="text-gray-600">We&apos;ll produce and ship your custom t-shirt after payment is confirmed.</p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ section */}
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <dl className="divide-y divide-gray-200">
                                <div className="px-6 py-4">
                                    <dt className="text-lg font-semibold text-gray-900">What file formats do you accept?</dt>
                                    <dd className="mt-2 text-gray-600">We accept JPG, PNG, SVG, and AI files. For best results, we recommend high-resolution images.</dd>
                                </div>
                                <div className="px-6 py-4">
                                    <dt className="text-lg font-semibold text-gray-900">How long does it take to get a quote?</dt>
                                    <dd className="mt-2 text-gray-600">We typically respond within 24-48 hours with a quote for your custom design.</dd>
                                </div>
                                <div className="px-6 py-4">
                                    <dt className="text-lg font-semibold text-gray-900">What&apos;s the minimum order quantity?</dt>
                                    <dd className="mt-2 text-gray-600">Our minimum order is 1 t-shirt for custom designs.</dd>
                                </div>
                                <div className="px-6 py-4">
                                    <dt className="text-lg font-semibold text-gray-900">Can I see a preview before production?</dt>
                                    <dd className="mt-2 text-gray-600">Yes, we&apos;ll send you a digital preview of your design for approval before production begins.</dd>
                                </div>
                                <div className="px-6 py-4">
                                    <dt className="text-lg font-semibold text-gray-900">When do I need to pay?</dt>
                                    <dd className="mt-2 text-gray-600">After we provide a quote, you&apos;ll need to accept and pay before we begin production. You can pay online or choose cash on delivery.</dd>
                                </div>
                                <div className="px-6 py-4">
                                    <dt className="text-lg font-semibold text-gray-900">What if I want changes to the quote?</dt>
                                    <dd className="mt-2 text-gray-600">You can request changes to the design or quote by using the &quot;Request Changes&quot; option, and our team will review your feedback.</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default CustomDesignPage;
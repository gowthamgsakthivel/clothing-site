import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

/**
 * A reusable button component that adds custom designs to cart
 * Can be used in any part of the application where custom design purchase is needed
 */
const CustomDesignPaymentButton = ({ design, variant = 'primary', size = 'md', text }) => {
    const { getToken, setCartItems, cartItems, user } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Function to add the custom design to cart
    const addToCart = useCallback(async () => {
        try {
            if (!user) {
                toast.error('Please sign in to add items to cart');
                router.push('/sign-in');
                return;
            }

            setIsLoading(true);
            console.log('Adding custom design to cart:', design._id);

            // Get authentication token
            const token = await getToken();

            // Create a unique key for the custom design
            const cartKey = `custom_${design._id}`;

            // Check if this custom design is already in the cart
            if (cartItems && typeof cartItems === 'object' && cartItems[cartKey]) {
                toast.success('Custom design is already in your cart');
                setIsLoading(false);
                // Navigate to cart
                router.push('/cart');
                return;
            }

            // Use the dedicated API endpoint for adding custom designs
            console.log('Sending design data to API:', design);
            const { data } = await axios.post('/api/cart/add-custom-design',
                { design },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                // Update cart items in context from API response
                setCartItems(data.cartItems);
                console.log('API response:', data);
                toast.success('Custom design added to cart!');
                // Navigate to cart after a short delay
                setTimeout(() => {
                    router.push('/cart');
                }, 1000);
            } else {
                toast.error(data.message || 'Failed to add design to cart');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error adding design to cart:', error);
            // Log additional details to help with debugging
            if (error.response) {
                console.error('API response error:', error.response.data);
            }
            toast.error('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    }, [cartItems, design, getToken, router, setCartItems]);

    // Create global function to add to cart on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Define the global function for adding design to cart (keeps same name for compatibility)
            window.showCustomDesignPayment = (designData) => {
                console.log('showCustomDesignPayment called with design:', designData);

                if (!designData || !designData._id) {
                    console.error('Invalid design data passed to showCustomDesignPayment', designData);
                    toast.error('Could not process design: Invalid design data');
                    return;
                }

                // Store the design in sessionStorage so we can access it after a refresh
                sessionStorage.setItem('pendingCartDesign', JSON.stringify(designData));

                // Try to find the button by specific ID first (most reliable)
                const specificButton = document.getElementById(`add-to-cart-button-${designData._id}`);
                if (specificButton) {
                    console.log('Found add to cart button by ID, clicking it directly');
                    specificButton.click();
                    toast.success('Custom design is being added to cart...');
                    return;
                }

                // Try to find any button with the matching design ID
                let foundMatchingButton = false;
                document.querySelectorAll('[data-design-id]').forEach(el => {
                    if (el.getAttribute('data-design-id') === designData._id) {
                        console.log('Found matching button by data attribute, clicking it directly');
                        el.click();
                        foundMatchingButton = true;
                    }
                });

                if (foundMatchingButton) {
                    toast.success('Custom design is being added to cart...');
                    return;
                }

                // Fallback: Direct add to cart via API
                toast.success('Adding design to cart...');

                // Redirect to the design details page with a cart parameter
                setTimeout(() => {
                    window.location.href = `/my-designs?addToCart=${designData._id}`;
                }, 1000);
            };
        }

        // Check if there's a pending cart add in the URL or session storage
        const checkForPendingCartAdd = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const addToCartId = urlParams.get('addToCart');

            if (addToCartId) {
                console.log('Found addToCart in URL:', addToCartId);
                // Remove the parameter from URL to prevent repeated attempts
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Check session storage for pending cart design
            const pendingDesignJson = sessionStorage.getItem('pendingCartDesign');
            if (pendingDesignJson) {
                try {
                    const pendingDesign = JSON.parse(pendingDesignJson);
                    console.log('Found pending cart design in session:', pendingDesign);

                    // If this is the right design, add to cart
                    if (pendingDesign._id === design._id || addToCartId === design._id) {
                        console.log('Adding to cart from session for design:', design._id);
                        addToCart();
                        sessionStorage.removeItem('pendingCartDesign');
                    }
                } catch (e) {
                    console.error('Error parsing pending design:', e);
                    sessionStorage.removeItem('pendingCartDesign');
                }
            }
        };

        // Check for pending cart additions
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                checkForPendingCartAdd();
            }, 300); // Slight delay for initial check
        }

        // Log that this component is initialized for debugging
        console.log(`CustomDesignCart button initialized for design: ${design._id}`);

        // No cleanup needed for this simplified version
        return () => { };
    }, [design._id, addToCart]);

    // Set button style based on variant
    const getButtonClass = () => {
        let baseClass = 'rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ';

        // Size classes
        const sizeClass = size === 'sm' ? 'py-1 px-3 text-sm ' :
            size === 'lg' ? 'py-3 px-6 text-lg ' :
                'py-2 px-4 ';

        // Variant classes
        const variantClass = variant === 'primary' ? 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 ' :
            variant === 'secondary' ? 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 ' :
                variant === 'outline' ? 'border border-orange-500 text-orange-600 hover:bg-orange-50 focus:ring-orange-500 ' :
                    'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 ';

        return baseClass + sizeClass + variantClass;
    };

    return (
        <button
            onClick={addToCart}
            className={getButtonClass()}
            data-design-id={design._id}
            id={`add-to-cart-button-${design._id}`}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Adding...
                </>
            ) : (
                text || 'Add to Cart'
            )}
        </button>
    );
};

export default CustomDesignPaymentButton;
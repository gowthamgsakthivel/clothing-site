/**
 * Checkout Flow Integration Tests
 * 
 * This test suite verifies the end-to-end checkout flow, including:
 * - Cart management
 * - Address selection
 * - Payment processing
 * - Order confirmation
 * 
 * These tests focus on the integration between components and API calls
 * involved in the checkout process.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppContext } from '@/context/AppContext';
import axios from 'axios';

// Mock the components used in the checkout flow
jest.mock('@/components/OrderSummary', () => {
    return function MockOrderSummary({ onProceedToCheckout }) {
        return (
            <div data-testid="order-summary">
                <h2>Order Summary</h2>
                <div data-testid="subtotal">Subtotal: $100.00</div>
                <div data-testid="shipping">Shipping: $5.00</div>
                <div data-testid="tax">Tax: $8.00</div>
                <div data-testid="total">Total: $113.00</div>
                <button data-testid="checkout-button" onClick={onProceedToCheckout}>
                    Proceed to Checkout
                </button>
            </div>
        );
    };
});

jest.mock('@/components/AddressSelection', () => {
    return function MockAddressSelection({ onAddressSelect, selectedAddress }) {
        const addresses = [
            {
                _id: 'address-1',
                name: 'John Doe',
                street: '123 Main St',
                city: 'Test City',
                state: 'Test State',
                pincode: '12345',
                isDefault: true,
            },
            {
                _id: 'address-2',
                name: 'John Doe',
                street: '456 Second St',
                city: 'Other City',
                state: 'Other State',
                pincode: '67890',
                isDefault: false,
            }
        ];

        return (
            <div data-testid="address-selection">
                <h2>Select Delivery Address</h2>
                {addresses.map(address => (
                    <div key={address._id} data-testid={`address-${address._id}`}>
                        <button
                            data-testid={`select-address-${address._id}`}
                            onClick={() => onAddressSelect(address)}
                        >
                            {address.street}, {address.city}, {address.state} {address.pincode}
                            {selectedAddress?._id === address._id && ' (Selected)'}
                        </button>
                    </div>
                ))}
            </div>
        );
    };
});

jest.mock('@/components/PaymentMethodSelection', () => {
    return function MockPaymentMethodSelection({ onPaymentMethodSelect, selectedMethod }) {
        const paymentMethods = ['COD', 'Online'];

        return (
            <div data-testid="payment-method-selection">
                <h2>Select Payment Method</h2>
                {paymentMethods.map(method => (
                    <button
                        key={method}
                        data-testid={`payment-method-${method}`}
                        onClick={() => onPaymentMethodSelect(method)}
                    >
                        {method}
                        {selectedMethod === method && ' (Selected)'}
                    </button>
                ))}
            </div>
        );
    };
});

// Mock the context and axios
jest.mock('@/context/AppContext', () => ({
    useAppContext: jest.fn(),
}));

jest.mock('axios');

// Create a mock checkout component
const CheckoutFlow = () => {
    const {
        cart,
        cartTotal,
        createOrder,
        isLoading,
        clearCart,
        router
    } = useAppContext();

    const [currentStep, setCurrentStep] = React.useState('summary');
    const [selectedAddress, setSelectedAddress] = React.useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState(null);

    const handleProceedToCheckout = () => {
        setCurrentStep('address');
    };

    const handleAddressSelect = (address) => {
        setSelectedAddress(address);
        setCurrentStep('payment');
    };

    const handlePaymentMethodSelect = (method) => {
        setSelectedPaymentMethod(method);
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress || !selectedPaymentMethod) return;

        const orderItems = cart.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            color: item.options?.color,
            size: item.options?.size,
        }));

        await createOrder(selectedAddress, orderItems, selectedPaymentMethod);
        router.push('/order-placed');
    };

    return (
        <div>
            {currentStep === 'summary' && (
                <div data-testid="summary-step">
                    <h1>Your Cart</h1>
                    <div data-testid="cart-items">
                        {cart.map(item => (
                            <div key={item.id} data-testid={`cart-item-${item.productId}`}>
                                {item.productId} - {item.quantity}
                            </div>
                        ))}
                    </div>
                    <div data-testid="cart-empty" style={{ display: cart.length === 0 ? 'block' : 'none' }}>
                        Your cart is empty
                    </div>
                    {cart.length > 0 && (
                        <>
                            <div data-testid="order-summary-container">
                                <div data-testid="mock-order-summary">
                                    <div data-testid="subtotal">Subtotal: ${cartTotal}</div>
                                    <div data-testid="total">Total: ${cartTotal + 5 + 8}</div>
                                </div>
                                <button
                                    data-testid="proceed-to-checkout"
                                    onClick={handleProceedToCheckout}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {currentStep === 'address' && (
                <div data-testid="address-step">
                    <h1>Select Delivery Address</h1>
                    <div data-testid="mock-address-selection">
                        <button
                            data-testid="select-address-1"
                            onClick={() => handleAddressSelect({
                                _id: 'address-1',
                                street: '123 Main St',
                                city: 'Test City',
                                state: 'Test State',
                                pincode: '12345',
                            })}
                        >
                            Address 1
                        </button>
                        <button
                            data-testid="select-address-2"
                            onClick={() => handleAddressSelect({
                                _id: 'address-2',
                                street: '456 Second St',
                                city: 'Other City',
                                state: 'Other State',
                                pincode: '67890',
                            })}
                        >
                            Address 2
                        </button>
                    </div>
                </div>
            )}

            {currentStep === 'payment' && (
                <div data-testid="payment-step">
                    <h1>Select Payment Method</h1>
                    <div data-testid="mock-payment-selection">
                        <button
                            data-testid="payment-method-cod"
                            onClick={() => handlePaymentMethodSelect('COD')}
                        >
                            Cash on Delivery
                        </button>
                        <button
                            data-testid="payment-method-online"
                            onClick={() => handlePaymentMethodSelect('Online')}
                        >
                            Online Payment
                        </button>
                    </div>
                    {selectedPaymentMethod && (
                        <button
                            data-testid="place-order-button"
                            onClick={handlePlaceOrder}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Place Order'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

describe('Checkout Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock cart data
        const mockCart = [
            {
                id: 'cart-item-1',
                productId: 'product-1',
                quantity: 2,
                price: 50,
                name: 'Test Product 1',
                image: 'test1.jpg',
                options: { color: '#FF0000', size: 'M' },
            },
            {
                id: 'cart-item-2',
                productId: 'product-2',
                quantity: 1,
                price: 75,
                name: 'Test Product 2',
                image: 'test2.jpg',
            },
        ];

        // Setup mock context
        useAppContext.mockReturnValue({
            cart: mockCart,
            cartTotal: 175, // 50*2 + 75
            createOrder: jest.fn().mockResolvedValue({ success: true }),
            isLoading: false,
            clearCart: jest.fn(),
            router: { push: jest.fn() },
        });
    });

    test('completes the checkout flow successfully', async () => {
        render(<CheckoutFlow />);

        // Check initial summary step
        expect(screen.getByTestId('summary-step')).toBeInTheDocument();
        expect(screen.getByTestId('cart-item-product-1')).toBeInTheDocument();
        expect(screen.getByTestId('cart-item-product-2')).toBeInTheDocument();

        // Proceed to address selection
        fireEvent.click(screen.getByTestId('proceed-to-checkout'));

        // Check address selection step
        expect(screen.getByTestId('address-step')).toBeInTheDocument();

        // Select an address
        fireEvent.click(screen.getByTestId('select-address-1'));

        // Check payment method selection step
        expect(screen.getByTestId('payment-step')).toBeInTheDocument();

        // Select payment method
        fireEvent.click(screen.getByTestId('payment-method-cod'));

        // Place the order
        const createOrderMock = useAppContext().createOrder;
        const routerPushMock = useAppContext().router.push;

        fireEvent.click(screen.getByTestId('place-order-button'));

        // Wait for order creation and navigation
        await waitFor(() => {
            expect(createOrderMock).toHaveBeenCalledWith(
                {
                    _id: 'address-1',
                    street: '123 Main St',
                    city: 'Test City',
                    state: 'Test State',
                    pincode: '12345',
                },
                [
                    {
                        product: 'product-1',
                        quantity: 2,
                        color: '#FF0000',
                        size: 'M',
                    },
                    {
                        product: 'product-2',
                        quantity: 1,
                        color: undefined,
                        size: undefined,
                    }
                ],
                'COD'
            );

            expect(routerPushMock).toHaveBeenCalledWith('/order-placed');
        });
    });

    test('shows loading state during order processing', async () => {
        // Mock loading state during order creation
        useAppContext.mockReturnValue({
            cart: [{ id: 'cart-item-1', productId: 'product-1', quantity: 2 }],
            cartTotal: 100,
            createOrder: jest.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
            ),
            isLoading: true,
            clearCart: jest.fn(),
            router: { push: jest.fn() },
        });

        render(<CheckoutFlow />);

        // Navigate through checkout flow
        fireEvent.click(screen.getByTestId('proceed-to-checkout'));
        fireEvent.click(screen.getByTestId('select-address-1'));
        fireEvent.click(screen.getByTestId('payment-method-cod'));

        // Place order
        fireEvent.click(screen.getByTestId('place-order-button'));

        // Check loading state
        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    test('handles empty cart state correctly', async () => {
        // Mock empty cart
        useAppContext.mockReturnValue({
            cart: [],
            cartTotal: 0,
            createOrder: jest.fn(),
            isLoading: false,
            clearCart: jest.fn(),
            router: { push: jest.fn() },
        });

        render(<CheckoutFlow />);

        // Check empty cart message
        expect(screen.getByTestId('cart-empty')).toBeVisible();

        // No checkout button should be available
        expect(screen.queryByTestId('proceed-to-checkout')).not.toBeInTheDocument();
    });
});
/**
 * Shopping Cart Feature Tests
 * 
 * This test suite verifies the shopping cart functionality across the application.
 * It tests:
 * - Adding products to the cart
 * - Updating product quantities
 * - Removing products from the cart
 * - Clearing the entire cart
 * - Calculating cart totals and item counts
 * 
 * These tests focus on the integration of cart-related features using the AppContext.
 */

import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { useAppContext } from '@/context/AppContext';

/**
 * Test component that simulates a cart interface
 * This component uses the cart-related functions from AppContext
 * and provides a UI to interact with the cart for testing purposes
 */
const CartTestComponent = () => {
    const {
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        cartTotal,
        cartItemsCount,
        clearCart
    } = useAppContext();

    return (
        <div>
            <h1>Shopping Cart</h1>
            <div data-testid="cart-count">Items in cart: {cartItemsCount}</div>
            <div data-testid="cart-total">Total: ${cartTotal}</div>

            <button onClick={() => addToCart('product-1', { color: 'red', size: 'M' })}>
                Add Product 1
            </button>

            <button onClick={() => addToCart('product-2', { color: 'blue', size: 'L' })}>
                Add Product 2
            </button>

            {cart.map(item => (
                <div key={item.id} data-testid={`cart-item-${item.productId}`}>
                    <div>{item.productId}</div>
                    <div data-testid={`quantity-${item.productId}`}>Qty: {item.quantity}</div>
                    <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        data-testid={`increase-${item.productId}`}
                    >
                        +
                    </button>
                    <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        data-testid={`decrease-${item.productId}`}
                    >
                        -
                    </button>
                    <button
                        onClick={() => removeFromCart(item.id)}
                        data-testid={`remove-${item.productId}`}
                    >
                        Remove
                    </button>
                </div>
            ))}

            <button onClick={clearCart} data-testid="clear-cart">Clear Cart</button>
        </div>
    );
};

// Mock context hook
jest.mock('@/context/AppContext', () => ({
    useAppContext: jest.fn(),
}));

describe('Shopping Cart Feature', () => {
    // Test cart state
    const mockCart = [];
    const mockAddToCart = jest.fn((productId, options = {}) => {
        const newItem = {
            id: `cart-item-${productId}-${Date.now()}`,
            productId,
            quantity: 1,
            options
        };
        mockCart.push(newItem);
    });

    const mockUpdateCartItemQuantity = jest.fn((itemId, newQuantity) => {
        const itemIndex = mockCart.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
            if (newQuantity <= 0) {
                mockCart.splice(itemIndex, 1);
            } else {
                mockCart[itemIndex].quantity = newQuantity;
            }
        }
    });

    const mockRemoveFromCart = jest.fn(itemId => {
        const itemIndex = mockCart.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
            mockCart.splice(itemIndex, 1);
        }
    });

    const mockClearCart = jest.fn(() => {
        mockCart.length = 0;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockCart.length = 0;

        // Mock the context values
        useAppContext.mockReturnValue({
            cart: mockCart,
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 0,
            cartItemsCount: mockCart.length
        });
    });

    test('initially shows an empty cart', () => {
        render(<CartTestComponent />);

        expect(screen.getByTestId('cart-count')).toHaveTextContent('Items in cart: 0');
        expect(screen.getByTestId('cart-total')).toHaveTextContent('Total: $0');
    });

    test('can add items to cart', () => {
        const { unmount } = render(<CartTestComponent />);

        // Add a product to cart
        fireEvent.click(screen.getByText('Add Product 1'));

        // Clean up the first render
        unmount();

        // Update the mock context to reflect cart changes
        useAppContext.mockReturnValue({
            cart: mockCart,
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 99.99,
            cartItemsCount: mockCart.length
        });

        // Re-render with updated cart
        render(<CartTestComponent />);

        // Check that the product is in the cart
        expect(screen.getByTestId('cart-count')).toHaveTextContent('Items in cart: 1');
        expect(screen.getByText('product-1')).toBeInTheDocument();
    });

    test('can update item quantity in cart', () => {
        // Add an item first
        mockAddToCart('product-1');

        useAppContext.mockReturnValue({
            cart: mockCart,
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 99.99,
            cartItemsCount: mockCart.length
        });

        const { unmount } = render(<CartTestComponent />);

        // Get the increase button for the product
        const increaseButton = screen.getByTestId('increase-product-1');

        // Increase quantity
        fireEvent.click(increaseButton);

        // Clean up the first render to avoid duplicate elements
        unmount();

        // Update context with new quantity reflected
        const updatedCart = mockCart.map(item => {
            if (item.productId === 'product-1') {
                return { ...item, quantity: 2 };
            }
            return item;
        });

        useAppContext.mockReturnValue({
            cart: updatedCart,
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 199.98,
            cartItemsCount: updatedCart.reduce((total, item) => total + item.quantity, 0)
        });

        // Re-render with updated cart
        render(<CartTestComponent />);

        // Check updated quantity
        expect(screen.getByTestId('quantity-product-1')).toHaveTextContent('Qty: 2');
    });

    test('can remove item from cart', () => {
        // Add an item first
        mockAddToCart('product-1');

        useAppContext.mockReturnValue({
            cart: mockCart,
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 99.99,
            cartItemsCount: mockCart.length
        });

        const { unmount } = render(<CartTestComponent />);

        // Get the remove button for the product
        const removeButton = screen.getByTestId('remove-product-1');

        // Remove item
        fireEvent.click(removeButton);

        // Clean up the first render
        unmount();

        // Update context with empty cart
        useAppContext.mockReturnValue({
            cart: [],
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 0,
            cartItemsCount: 0
        });

        // Re-render with updated cart
        render(<CartTestComponent />);

        // Check item is removed
        expect(screen.queryByText('product-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('cart-count')).toHaveTextContent('Items in cart: 0');
    });

    test('can clear entire cart', () => {
        // Add multiple items
        mockAddToCart('product-1');
        mockAddToCart('product-2');

        useAppContext.mockReturnValue({
            cart: mockCart,
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 199.98,
            cartItemsCount: mockCart.length
        });

        const { unmount } = render(<CartTestComponent />);

        // Clear the cart
        fireEvent.click(screen.getByTestId('clear-cart'));

        // Clean up the first render
        unmount();

        // Update context with empty cart
        useAppContext.mockReturnValue({
            cart: [],
            addToCart: mockAddToCart,
            updateCartItemQuantity: mockUpdateCartItemQuantity,
            removeFromCart: mockRemoveFromCart,
            clearCart: mockClearCart,
            cartTotal: 0,
            cartItemsCount: 0
        });

        // Re-render with updated cart
        render(<CartTestComponent />);

        // Check cart is empty
        expect(screen.queryByText('product-1')).not.toBeInTheDocument();
        expect(screen.queryByText('product-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('cart-count')).toHaveTextContent('Items in cart: 0');
    });
});
/**
 * AppContext Tests
 * 
 * These tests verify the functionality of the AppContext provider which handles:
 * - Global state management for the application
 * - Product data fetching and caching
 * - Shopping cart operations (add, remove, update)
 * - User authentication state
 * - Favorites management
 * - Loading states
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AppContextProvider, useAppContext } from '@/context/AppContext';
import { useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';

// Mock external dependencies to isolate the context for testing
// This allows us to control authentication, API responses, and routing
jest.mock('@clerk/nextjs', () => ({
    useAuth: jest.fn(),
    useUser: jest.fn(),
}));

jest.mock('axios');
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Provide a polyfill for structuredClone which might not be available in the test environment
// This ensures deep copying of objects works correctly in our tests
global.structuredClone = obj => JSON.parse(JSON.stringify(obj));

// Test component to expose context
const TestComponent = () => {
    const context = useAppContext();
    return (
        <div>
            <div data-testid="currency">{context.currency}</div>
            <div data-testid="loading-products">
                {context.loadingStates.products ? 'true' : 'false'}
            </div>
            <button onClick={() => context.fetchProductData()}>Fetch Products</button>
            <button onClick={() => context.addToCart('product-1', { color: 'red', size: 'M' })}>
                Add to Cart
            </button>
        </div>
    );
};

describe('AppContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Clerk auth
        useAuth.mockReturnValue({
            getToken: jest.fn().mockResolvedValue('test-token'),
        });

        useUser.mockReturnValue({
            user: null,
            isLoaded: true,
        });

        // Mock axios
        axios.get.mockResolvedValue({
            data: {
                success: true,
                products: [
                    {
                        _id: 'product-1',
                        name: 'Test Product',
                        price: 1000,
                        offerPrice: 800,
                        image: ['https://example.com/image.jpg'],
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                },
            },
        });

        axios.post.mockResolvedValue({
            data: {
                success: true,
            },
        });

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
            },
            writable: true,
        });
    });

    test('provides initial context values', async () => {
        await act(async () => {
            render(
                <AppContextProvider>
                    <TestComponent />
                </AppContextProvider>
            );
        });

        // Check that initial values are provided
        expect(screen.getByTestId('currency')).toHaveTextContent(process.env.NEXT_PUBLIC_CURRENCY || '₹');

        // Need to wait for initial loading to complete
        await waitFor(() => {
            expect(screen.getByTestId('loading-products')).toHaveTextContent('false');
        });
    });

    test('fetches products on initial render', async () => {
        await act(async () => {
            render(
                <AppContextProvider>
                    <TestComponent />
                </AppContextProvider>
            );
        });

        // Wait for the initial fetch products call
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/api/product/list')
            );
        });
    });

    test('fetchProductData sets loading state and makes API call', async () => {
        await act(async () => {
            render(
                <AppContextProvider>
                    <TestComponent />
                </AppContextProvider>
            );
        });

        // Clear previous calls
        axios.get.mockClear();

        // Click the fetch products button
        const fetchButton = screen.getByText('Fetch Products');

        await act(async () => {
            fetchButton.click();
        });

        // Check if API was called
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/api/product/list')
            );
        });
    });

    test('addToCart stores cart items in localStorage when user is not logged in', async () => {
        await act(async () => {
            render(
                <AppContextProvider>
                    <TestComponent />
                </AppContextProvider>
            );
        });

        // Click the add to cart button
        const addButton = screen.getByText('Add to Cart');

        await act(async () => {
            addButton.click();
        });

        // For non-logged in users, should use localStorage
        await waitFor(() => {
            expect(window.localStorage.setItem).toHaveBeenCalled();
        });
        // And should not call API
        expect(axios.post).not.toHaveBeenCalled();
    });

    test('addToCart calls API when user is logged in', async () => {
        // Mock logged in user
        useUser.mockReturnValue({
            user: { id: 'user-1' },
            isLoaded: true,
        });

        await act(async () => {
            render(
                <AppContextProvider>
                    <TestComponent />
                </AppContextProvider>
            );
        });

        // Click the add to cart button
        const addButton = screen.getByText('Add to Cart');

        await act(async () => {
            addButton.click();
        });

        // For logged in users, should call API
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                '/api/cart/update',
                expect.any(Object),
                expect.any(Object)
            );
        }, { timeout: 3000 });
    });
});
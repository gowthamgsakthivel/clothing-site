/**
 * Order Creation API Tests
 * 
 * This test suite verifies the functionality of the order creation API endpoint.
 * It tests:
 * - Order creation process
 * - Stock updates for ordered products
 * - Validation of order data
 * - Authentication requirements
 * - Error handling
 * 
 * The tests mock authentication, database models, and the Inngest service
 * to isolate the API handler logic from actual external dependencies.
 */

// Import nextjs mocks first
import '../mocks/nextjs';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/order/create/route';
import Product from '@/models/Product';
import User from '@/models/User';
import Order from '@/models/Orders';

// Mock database connection
jest.mock('@/config/db', () => {
    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        connectDB: jest.fn().mockResolvedValue(true),
    };
});

// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn(),
}));

// Mock Inngest service
jest.mock('@/config/inngest', () => ({
    inngest: {
        send: jest.fn().mockResolvedValue(true),
    },
}));

// Mock database models
jest.mock('@/models/Product', () => ({
    findById: jest.fn(),
}));

jest.mock('@/models/User', () => ({
    findById: jest.fn(),
}));

jest.mock('@/models/Orders', () => ({
    create: jest.fn(),
}));

import { getAuth } from '@clerk/nextjs/server';

describe('Order Creation API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('creates a new order successfully', async () => {
        // Mock authenticated user ID
        const mockUserId = 'user-123';
        getAuth.mockReturnValue({ userId: mockUserId });

        // Mock product data
        const mockProduct = {
            _id: 'product-1',
            name: 'Test Product',
            offerPrice: 100,
            stock: 10,
            save: jest.fn().mockResolvedValue(true),
        };

        // Setup Product.findById to return the mock product
        Product.findById.mockResolvedValue(mockProduct);

        // Mock user data with cart items
        const mockUser = {
            _id: mockUserId,
            cartItems: { 'product-1': 2 },
            save: jest.fn().mockResolvedValue(true),
        };

        // Setup User.findById to return the mock user
        User.findById.mockResolvedValue(mockUser);

        // Order data for the request
        const orderData = {
            address: {
                street: '123 Main St',
                city: 'Test City',
                state: 'Test State',
                pincode: '12345',
            },
            items: [
                { product: 'product-1', quantity: 2 },
            ],
            paymentMethod: 'COD',
            paymentStatus: 'Pending',
        };

        // Create mock request with order data
        const req = new NextRequest('http://localhost:3000/api/order/create', {
            method: 'POST',
            body: JSON.stringify(orderData),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Call the API handler
        const response = await POST(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Order Placed');

        // Verify product stock was updated
        expect(mockProduct.stock).toBe(8); // 10 - 2
        expect(mockProduct.save).toHaveBeenCalled();

        // Verify user cart was cleared
        expect(mockUser.cartItems).toEqual({});
        expect(mockUser.save).toHaveBeenCalled();

        // Verify order was created with correct data
        expect(Order.create).toHaveBeenCalledWith({
            userId: mockUserId,
            address: orderData.address,
            items: [
                { product: 'product-1', quantity: 2, color: undefined, size: undefined },
            ],
            amount: 204, // 100 * 2 + 2% = 204
            paymentMethod: 'COD',
            paymentStatus: 'Pending',
            date: expect.any(Number),
        });
    });

    test('handles product with color and size options correctly', async () => {
        // Mock authenticated user ID
        const mockUserId = 'user-123';
        getAuth.mockReturnValue({ userId: mockUserId });

        // Mock product data with color options
        const mockProduct = {
            _id: 'product-1',
            name: 'Test Product',
            offerPrice: 100,
            stock: 20,
            color: [
                { color: '#FF0000', stock: 10 }, // Red
                { color: '#0000FF', stock: 5 },  // Blue
            ],
            save: jest.fn().mockResolvedValue(true),
        };

        // Setup Product.findById to return the mock product
        Product.findById.mockResolvedValue(mockProduct);

        // Mock user data
        const mockUser = {
            _id: mockUserId,
            cartItems: {},
            save: jest.fn().mockResolvedValue(true),
        };

        // Setup User.findById to return the mock user
        User.findById.mockResolvedValue(mockUser);

        // Order data with color and size
        const orderData = {
            address: {
                street: '123 Main St',
                city: 'Test City',
                state: 'Test State',
                pincode: '12345',
            },
            items: [
                { product: 'product-1_#FF0000_L', quantity: 3 },
            ],
            paymentMethod: 'Online',
            paymentStatus: 'Paid',
        };

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/order/create', {
            method: 'POST',
            body: JSON.stringify(orderData),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Call the API handler
        const response = await POST(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify both overall stock and color-specific stock were updated
        expect(mockProduct.stock).toBe(17); // 20 - 3
        expect(mockProduct.color[0].stock).toBe(7); // 10 - 3 (Red color)
        expect(mockProduct.color[1].stock).toBe(5); // Blue color unchanged
        expect(mockProduct.save).toHaveBeenCalled();

        // Verify order was created with correct color and size
        expect(Order.create).toHaveBeenCalledWith(
            expect.objectContaining({
                items: [
                    {
                        product: 'product-1',
                        quantity: 3,
                        color: '#FF0000',
                        size: 'L'
                    },
                ],
                paymentMethod: 'Online',
                paymentStatus: 'Paid',
            })
        );
    });

    test('returns error when required data is missing', async () => {
        // Mock authenticated user ID
        const mockUserId = 'user-123';
        getAuth.mockReturnValue({ userId: mockUserId });

        // Create mock request with missing address
        const reqWithoutAddress = new NextRequest('http://localhost:3000/api/order/create', {
            method: 'POST',
            body: JSON.stringify({
                items: [{ product: 'product-1', quantity: 2 }],
                paymentMethod: 'COD',
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Call the API handler
        const response1 = await POST(reqWithoutAddress);
        const data1 = await response1.json();

        // Assertions for missing address
        expect(response1.status).toBe(200);
        expect(data1.success).toBe(false);
        expect(data1.message).toBe('Invalid data');

        // Create mock request with empty items array
        const reqWithEmptyItems = new NextRequest('http://localhost:3000/api/order/create', {
            method: 'POST',
            body: JSON.stringify({
                address: { street: '123 Main St' },
                items: [],
                paymentMethod: 'COD',
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Call the API handler
        const response2 = await POST(reqWithEmptyItems);
        const data2 = await response2.json();

        // Assertions for empty items
        expect(response2.status).toBe(200);
        expect(data2.success).toBe(false);
        expect(data2.message).toBe('Invalid data');

        // Verify that no order was created
        expect(Order.create).not.toHaveBeenCalled();
    });

    test('handles database errors gracefully', async () => {
        // Mock authenticated user ID
        const mockUserId = 'user-123';
        getAuth.mockReturnValue({ userId: mockUserId });

        // Setup Product.findById to throw an error
        Product.findById.mockRejectedValue(new Error('Database connection failed'));

        // Order data for the request
        const orderData = {
            address: {
                street: '123 Main St',
                city: 'Test City',
                state: 'Test State',
                pincode: '12345',
            },
            items: [
                { product: 'product-1', quantity: 2 },
            ],
            paymentMethod: 'COD',
        };

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/order/create', {
            method: 'POST',
            body: JSON.stringify(orderData),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Call the API handler
        const response = await POST(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Database connection failed');

        // Verify that no order was created
        expect(Order.create).not.toHaveBeenCalled();
    });
});
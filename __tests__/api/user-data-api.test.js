/**
 * User Data API Tests
 * 
 * This test suite verifies the functionality of the user data API endpoint.
 * It tests:
 * - Authentication requirements
 * - Retrieving user data
 * - Handling non-existent users
 * - Error handling
 * 
 * The tests mock Clerk authentication and the User model to isolate
 * the API handler logic from actual authentication and database operations.
 */

// Import nextjs mocks first to define global Request and Response
import '../mocks/nextjs';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/user/data/route';
import User from '@/models/User';

// Import nextjs mocks first
import '../mocks/nextjs';

// Mock the database connection to avoid actual DB operations during tests
jest.mock('@/config/db', () => {
    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        connectDB: jest.fn().mockResolvedValue(true),
    };
});

// Mock the User model to control its behavior during tests
jest.mock('@/models/User', () => {
    return {
        findById: jest.fn(),
    };
});

// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn(),
}));

import { getAuth } from '@clerk/nextjs/server';

describe('User Data API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns user data when user exists', async () => {
        // Mock authenticated user ID
        const mockUserId = 'user-123';
        getAuth.mockReturnValue({ userId: mockUserId });

        // Mock user data
        const mockUser = {
            _id: mockUserId,
            name: 'Test User',
            email: 'test@example.com',
            favorites: ['product-1', 'product-2'],
            addresses: [
                {
                    _id: 'address-1',
                    street: '123 Main St',
                    city: 'Test City',
                    state: 'Test State',
                    pincode: '12345',
                    isDefault: true,
                }
            ],
        };

        // Setup User.findById to return the mock user
        User.findById.mockResolvedValue(mockUser);

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/user/data');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user).toEqual(mockUser);

        // Verify the findById call was made with the correct user ID
        expect(User.findById).toHaveBeenCalledWith(mockUserId);
    });

    test('returns error when user is not found', async () => {
        // Mock authenticated user ID
        const mockUserId = 'non-existent-user';
        getAuth.mockReturnValue({ userId: mockUserId });

        // Setup User.findById to return null (user not found)
        User.findById.mockResolvedValue(null);

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/user/data');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200); // The API returns 200 even for not found
        expect(data.success).toBe(false);
        expect(data.message).toBe('user not found');

        // Verify the findById call was made with the correct user ID
        expect(User.findById).toHaveBeenCalledWith(mockUserId);
    });

    test('returns error when no authentication is provided', async () => {
        // Mock no authentication (userId is undefined)
        getAuth.mockReturnValue({ userId: undefined });

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/user/data');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200); // The API returns 200 even for errors
        expect(data.success).toBe(false);
        expect(data.message).toBeDefined(); // Some error message should be present

        // User.findById should not be called without a valid userId
        expect(User.findById).not.toHaveBeenCalled();
    });

    test('handles database errors gracefully', async () => {
        // Mock authenticated user ID
        const mockUserId = 'user-123';
        getAuth.mockReturnValue({ userId: mockUserId });

        // Setup User.findById to throw an error
        User.findById.mockRejectedValue(new Error('Database connection failed'));

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/user/data');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200); // The API returns 200 even for errors
        expect(data.success).toBe(false);
        expect(data.message).toBe('Database connection failed');

        // Verify the findById call was attempted
        expect(User.findById).toHaveBeenCalledWith(mockUserId);
    });
});
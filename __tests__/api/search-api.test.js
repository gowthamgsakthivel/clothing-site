/**
 * Product Search API Tests
 * 
 * This test suite verifies the functionality of the product search API endpoint.
 * It tests:
 * - Search functionality with different query parameters
 * - Pagination handling
 * - Empty results handling
 * - Error handling
 * 
 * The tests mock the database connection and Product model to isolate
 * the API handler logic from the actual database operations.
 */

// Import nextjs mocks first to define global Request and Response
import '../mocks/nextjs';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/product/search/route';
import Product from '@/models/Product';

// Mock the database connection to avoid actual DB operations during tests
jest.mock('@/config/db', () => {
    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        connectDB: jest.fn().mockResolvedValue(true),
    };
});

// Mock the Product model to control its behavior during tests
// This allows us to simulate different database responses
jest.mock('@/models/Product', () => {
    return {
        find: jest.fn(),
        countDocuments: jest.fn(),
    };
});

describe('Product Search API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns search results based on query parameter', async () => {
        // Mock data
        const mockProducts = [
            {
                _id: 'product-1',
                name: 'Test Product 1',
                description: 'This is test product 1',
                price: 99.99,
                offerPrice: 89.99,
                images: ['image1.jpg'],
                category: 'category-1',
                genderCategory: 'gender-1',
                stock: 10,
            }
        ];

        // Setup the mock implementation for find
        Product.find.mockImplementation(() => ({
            limit: jest.fn().mockReturnValue({
                skip: jest.fn().mockResolvedValue(mockProducts),
            }),
        }));

        // Setup mock for countDocuments
        Product.countDocuments.mockResolvedValue(1);

        // Create mock request with search query
        const req = new NextRequest('http://localhost:3000/api/product/search?q=test');
        const { searchParams } = new URL(req.url);

        // Call the API route handler
        const response = await GET(req, { params: {}, searchParams });
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.products).toEqual(mockProducts);
        expect(data.pagination.totalResults).toBe(1);
        expect(Product.find).toHaveBeenCalledWith(
            expect.objectContaining({
                $or: [
                    { name: expect.objectContaining({ $regex: 'test', $options: 'i' }) },
                    { description: expect.objectContaining({ $regex: 'test', $options: 'i' }) },
                ],
            })
        );
    });

    test('returns empty array when no results found', async () => {
        // Setup the mock implementation for empty results
        Product.find.mockImplementation(() => ({
            limit: jest.fn().mockReturnValue({
                skip: jest.fn().mockResolvedValue([]),
            }),
        }));

        // Setup mock for countDocuments with zero results
        Product.countDocuments.mockResolvedValue(0);

        // Create mock request with search query
        const req = new NextRequest('http://localhost:3000/api/product/search?q=nonexistent');
        const { searchParams } = new URL(req.url);

        // Call the API route handler
        const response = await GET(req, { params: {}, searchParams });
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.products).toEqual([]);
        expect(data.pagination.totalResults).toBe(0);
    });

    test('handles pagination parameters correctly', async () => {
        // Mock data
        const mockProducts = [
            {
                _id: 'product-2',
                name: 'Test Product 2',
                description: 'This is test product 2',
                price: 129.99,
                offerPrice: 119.99,
                images: ['image2.jpg'],
                category: 'category-2',
                genderCategory: 'gender-2',
                stock: 5,
            }
        ];

        // Setup mock functions
        const limitMock = jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockProducts),
        });

        Product.find.mockImplementation(() => ({
            limit: limitMock,
        }));

        Product.countDocuments.mockResolvedValue(20);

        // Create mock request with pagination
        const req = new NextRequest('http://localhost:3000/api/product/search?q=test&page=2&limit=10');
        const { searchParams } = new URL(req.url);

        // Call the API route handler
        const response = await GET(req, { params: {}, searchParams });
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.products).toEqual(mockProducts);
        expect(data.pagination).toEqual({
            totalResults: 20,
            totalPages: 2,
            currentPage: 2,
            limit: 10,
        });

        // Verify pagination parameters were used correctly
        expect(limitMock).toHaveBeenCalledWith(10);
        expect(limitMock().skip).toHaveBeenCalledWith(10);
    });

    test('handles database errors gracefully', async () => {
        // Setup mock to throw an error
        Product.find.mockImplementation(() => {
            throw new Error('Database connection failed');
        });

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/product/search?q=test');
        const { searchParams } = new URL(req.url);

        // Call the API route handler
        const response = await GET(req, { params: {}, searchParams });
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to search products');
    });
});
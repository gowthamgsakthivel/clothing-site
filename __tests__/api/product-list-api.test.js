/**
 * Product List API Tests
 * 
 * This test suite verifies the functionality of the product list API endpoint.
 * It tests:
 * - Retrieving all products with pagination
 * - Handling different page sizes and page numbers
 * - Pagination metadata calculation
 * - Error handling
 * 
 * The tests mock the database connection and Product model to isolate
 * the API handler logic from the actual database operations.
 */

// Import nextjs mocks first
import '../mocks/nextjs';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/product/list/route';
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
jest.mock('@/models/Product', () => {
    return {
        find: jest.fn(),
        countDocuments: jest.fn(),
    };
});

describe('Product List API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns products with default pagination (page 1, limit 10)', async () => {
        // Create mock data for 10 products
        const mockProducts = Array.from({ length: 10 }, (_, i) => ({
            _id: `product-${i + 1}`,
            name: `Product ${i + 1}`,
            price: 100 + i,
            offerPrice: 90 + i,
            images: [`image${i + 1}.jpg`],
            stock: 10 + i,
        }));

        // Setup mock implementations
        const sortMock = jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
            }),
        });

        Product.find.mockReturnValue({
            sort: sortMock,
        });

        // Mock total count for pagination
        Product.countDocuments.mockResolvedValue(30);

        // Create mock request with default pagination (no query params)
        const req = new NextRequest('http://localhost:3000/api/product/list');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.products).toEqual(mockProducts);

        // Check pagination metadata
        expect(data.pagination).toEqual({
            total: 30,
            page: 1,
            limit: 10,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: false
        });

        // Verify the find call was made correctly
        expect(Product.find).toHaveBeenCalledWith({});
        expect(sortMock).toHaveBeenCalledWith({ date: -1 });
        expect(sortMock().skip).toHaveBeenCalledWith(0);
        expect(sortMock().skip().limit).toHaveBeenCalledWith(10);
    });

    test('handles custom pagination parameters correctly', async () => {
        // Create mock data for 5 products on page 3
        const mockProducts = Array.from({ length: 5 }, (_, i) => ({
            _id: `product-${i + 21}`,
            name: `Product ${i + 21}`,
            price: 100 + i,
            offerPrice: 90 + i,
            images: [`image${i + 21}.jpg`],
            stock: 10 + i,
        }));

        // Setup mock implementations
        const sortMock = jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
            }),
        });

        Product.find.mockReturnValue({
            sort: sortMock,
        });

        // Mock total count for pagination
        Product.countDocuments.mockResolvedValue(25);

        // Create mock request with custom pagination
        const req = new NextRequest('http://localhost:3000/api/product/list?page=3&limit=5');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.products).toEqual(mockProducts);

        // Check pagination metadata
        expect(data.pagination).toEqual({
            total: 25,
            page: 3,
            limit: 5,
            totalPages: 5,
            hasNextPage: true,
            hasPrevPage: true
        });

        // Verify the pagination parameters were used correctly
        expect(sortMock().skip).toHaveBeenCalledWith(10); // (page-1) * limit = (3-1) * 5 = 10
        expect(sortMock().skip().limit).toHaveBeenCalledWith(5);
    });

    test('returns empty array when no products exist', async () => {
        // Setup mock implementations for empty results
        const sortMock = jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
            }),
        });

        Product.find.mockReturnValue({
            sort: sortMock,
        });

        // Mock zero total count
        Product.countDocuments.mockResolvedValue(0);

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/product/list');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.products).toEqual([]);

        // Check pagination metadata for empty results
        expect(data.pagination).toEqual({
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
        });
    });

    test('handles database errors gracefully', async () => {
        // Setup mock to throw an error
        Product.find.mockImplementation(() => {
            throw new Error('Database connection failed');
        });

        // Create mock request
        const req = new NextRequest('http://localhost:3000/api/product/list');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200); // The API returns 200 even for errors
        expect(data.success).toBe(false);
        expect(data.message).toBe('Database connection failed');
    });
});
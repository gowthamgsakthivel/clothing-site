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
import { GET } from '@/app/api/product/search/route';
import ProductV2 from '@/models/v2/Product';
import Inventory from '@/models/v2/Inventory';

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
jest.mock('@/models/v2/Product', () => ({
    aggregate: jest.fn(),
}));

jest.mock('@/models/v2/Inventory', () => ({
    find: jest.fn(),
}));


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
                brand: 'Brand X',
                category: 'category-1',
                slug: 'test-product-1',
                variants: [
                    { _id: 'variant-1', offerPrice: 89.99 }
                ]
            }
        ];

        ProductV2.aggregate.mockResolvedValue([
            { data: mockProducts, total: [{ count: 1 }] }
        ]);

        Inventory.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { variantId: 'variant-1', totalStock: 5, reservedStock: 0 }
            ])
        });

        // Create mock request with search query
        const req = {
            url: 'http://localhost:3000/api/product/search?q=test',
            headers: { get: () => null },
        };
        const { searchParams } = new URL(req.url);

        // Call the API route handler
        const response = await GET(req, { params: {}, searchParams });
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.products).toEqual([
            expect.objectContaining({
                product: expect.objectContaining({
                    _id: 'product-1',
                    name: 'Test Product 1',
                })
            })
        ]);
        expect(data.pagination.totalResults).toBe(1);
        expect(ProductV2.aggregate).toHaveBeenCalledTimes(1);
    });

    test('returns empty array when no results found', async () => {
        ProductV2.aggregate.mockResolvedValue([
            { data: [], total: [] }
        ]);

        // Create mock request with search query
        const req = {
            url: 'http://localhost:3000/api/product/search?q=nonexistent',
            headers: { get: () => null },
        };
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
                brand: 'Brand Y',
                category: 'category-2',
                slug: 'test-product-2',
                variants: [
                    { _id: 'variant-2', offerPrice: 119.99 }
                ]
            }
        ];

        ProductV2.aggregate.mockResolvedValue([
            { data: mockProducts, total: [{ count: 20 }] }
        ]);

        Inventory.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([
                { variantId: 'variant-2', totalStock: 5, reservedStock: 0 }
            ])
        });

        // Create mock request with pagination
        const req = {
            url: 'http://localhost:3000/api/product/search?q=test&page=2&limit=10',
            headers: { get: () => null },
        };
        const { searchParams } = new URL(req.url);

        // Call the API route handler
        const response = await GET(req, { params: {}, searchParams });
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.products).toEqual([
            expect.objectContaining({
                product: expect.objectContaining({
                    _id: 'product-2',
                    name: 'Test Product 2',
                })
            })
        ]);
        expect(data.pagination).toEqual({
            currentPage: 2,
            totalResults: 20,
            totalPages: 2,
            hasMore: false,
        });
    });

    test('handles database errors gracefully', async () => {
        // Setup mock to throw an error
        ProductV2.aggregate.mockRejectedValue(new Error('Database connection failed'));

        // Create mock request
        const req = {
            url: 'http://localhost:3000/api/product/search?q=test',
            headers: { get: () => null },
        };
        const { searchParams } = new URL(req.url);

        // Call the API route handler
        const response = await GET(req, { params: {}, searchParams });
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(500);
        expect(data.message).toBe('Failed to search products');
    });
});
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
 * The tests mock the database connection and v2 models to isolate
 * the API handler logic from the actual database operations.
 */

// Import nextjs mocks first
import '../mocks/nextjs';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/product/list/route';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';

// Mock the database connection to avoid actual DB operations during tests
jest.mock('@/config/db', () => {
    return {
        __esModule: true,
        default: jest.fn().mockResolvedValue(true),
        connectDB: jest.fn().mockResolvedValue(true),
    };
});

// Mock the v2 models to control their behavior during tests
jest.mock('@/models/v2/Product', () => {
    return {
        find: jest.fn(),
        countDocuments: jest.fn(),
    };
});

jest.mock('@/models/v2/ProductVariant', () => {
    return {
        find: jest.fn(),
    };
});

jest.mock('@/models/v2/Inventory', () => {
    return {
        find: jest.fn(),
    };
});

describe('Product List API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns products with default pagination (page 1, limit 10)', async () => {
        const mockProducts = Array.from({ length: 10 }, (_, i) => ({
            _id: `product-${i + 1}`,
            name: `Product ${i + 1}`,
            description: `Desc ${i + 1}`,
            category: 'Category',
            brand: 'Brand',
            genderCategory: 'Unisex',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            status: 'active',
            slug: `product-${i + 1}`
        }));

        const mockVariants = mockProducts.flatMap((product) => ([
            {
                _id: `${product._id}-variant-1`,
                productId: product._id,
                color: 'Red',
                size: 'M',
                sku: `${product._id}-sku-1`,
                originalPrice: 120,
                offerPrice: 90,
                visibility: 'visible',
                images: [`${product._id}-image.jpg`]
            }
        ]));

        const mockInventory = mockVariants.map((variant) => ({
            variantId: variant._id,
            sku: variant.sku,
            totalStock: 10,
            reservedStock: 0,
            lowStockThreshold: 5
        }));

        const limitMock = jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProducts)
        });
        const skipMock = jest.fn().mockReturnValue({
            limit: limitMock
        });
        const sortMock = jest.fn().mockReturnValue({
            skip: skipMock
        });

        ProductV2.find.mockReturnValue({
            sort: sortMock
        });

        ProductV2.countDocuments.mockResolvedValue(30);
        ProductVariant.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockVariants)
        });
        Inventory.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockInventory)
        });

        // Create mock request with default pagination (no query params)
        const req = new NextRequest('http://localhost:3000/api/product/list');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.products).toHaveLength(10);

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
        expect(ProductV2.find).toHaveBeenCalledWith({ status: 'active' });
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(skipMock).toHaveBeenCalledWith(0);
        expect(limitMock).toHaveBeenCalledWith(10);
    });

    test('handles custom pagination parameters correctly', async () => {
        const mockProducts = Array.from({ length: 5 }, (_, i) => ({
            _id: `product-${i + 21}`,
            name: `Product ${i + 21}`,
            description: `Desc ${i + 21}`,
            category: 'Category',
            brand: 'Brand',
            genderCategory: 'Unisex',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            status: 'active',
            slug: `product-${i + 21}`
        }));

        const mockVariants = mockProducts.map((product) => ({
            _id: `${product._id}-variant-1`,
            productId: product._id,
            color: 'Black',
            size: 'L',
            sku: `${product._id}-sku-1`,
            originalPrice: 140,
            offerPrice: 110,
            visibility: 'visible',
            images: [`${product._id}-image.jpg`]
        }));

        const mockInventory = mockVariants.map((variant) => ({
            variantId: variant._id,
            sku: variant.sku,
            totalStock: 8,
            reservedStock: 0,
            lowStockThreshold: 5
        }));

        const limitMock = jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProducts)
        });
        const skipMock = jest.fn().mockReturnValue({
            limit: limitMock
        });
        const sortMock = jest.fn().mockReturnValue({
            skip: skipMock
        });

        ProductV2.find.mockReturnValue({
            sort: sortMock
        });

        ProductV2.countDocuments.mockResolvedValue(25);
        ProductVariant.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockVariants)
        });
        Inventory.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockInventory)
        });

        // Create mock request with custom pagination
        const req = new NextRequest('http://localhost:3000/api/product/list?page=3&limit=5');

        // Call the API handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.products).toHaveLength(5);

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
        expect(skipMock).toHaveBeenCalledWith(10); // (page-1) * limit = (3-1) * 5 = 10
        expect(limitMock).toHaveBeenCalledWith(5);
    });

    test('returns empty array when no products exist', async () => {
        // Setup mock implementations for empty results
        const limitMock = jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });
        const skipMock = jest.fn().mockReturnValue({
            limit: limitMock
        });
        const sortMock = jest.fn().mockReturnValue({
            skip: skipMock
        });

        ProductV2.find.mockReturnValue({
            sort: sortMock
        });

        ProductV2.countDocuments.mockResolvedValue(0);
        ProductVariant.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });
        Inventory.find.mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });

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
        ProductV2.find.mockImplementation(() => {
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
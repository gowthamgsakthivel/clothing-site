/**
 * API Route Tests for Products (app/api/product/list & app/api/product/search)
 */

import { GET as getProductList } from '@/app/api/product/list/route';
import { GET as searchProducts } from '@/app/api/product/search/route';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import { NextRequest } from 'next/server';

jest.mock('@/models/v2/Product', () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        countDocuments: jest.fn(),
        aggregate: jest.fn(),
    }
}));

jest.mock('@/models/v2/ProductVariant', () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
    }
}));

jest.mock('@/models/v2/Inventory', () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
    }
}));

jest.mock('@/lib/apiCache', () => ({
    getCachedResponse: jest.fn((key, fn) => fn())
}));

const mockChain = (data) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data)
});

describe('Products API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/product/list', () => {
        test('returns paginated products with variants and inventory', async () => {
            const fakeProducts = [
                { _id: 'prod-1', name: 'Product 1', status: 'active' }
            ];
            const fakeVariants = [
                { _id: 'var-1', productId: 'prod-1', color: 'Dark Green', size: 'M', offerPrice: 500 }
            ];
            const fakeInventories = [
                { variantId: 'var-1', totalStock: 10, reservedStock: 1 }
            ];

            ProductV2.countDocuments.mockResolvedValue(1);
            ProductV2.find.mockReturnValue(mockChain(fakeProducts));
            ProductVariant.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(fakeVariants) });
            Inventory.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(fakeInventories) });

            const req = { url: 'http://localhost:3000/api/product/list?page=1&limit=10' };
            const response = await getProductList(req);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.products).toHaveLength(1);
            expect(body.products[0].product.name).toBe('Product 1');
            expect(body.products[0].variants).toHaveLength(1);
            expect(body.pagination.total).toBe(1);
        });
    });

    describe('GET /api/product/search', () => {
        test('returns matching products for search query', async () => {
            const fakeProducts = [
                { _id: 'prod-1', name: 'Green Sports Jersey', status: 'active' }
            ];
            const fakeVariants = [
                { _id: 'var-1', productId: 'prod-1', color: 'Dark Green', size: 'M', offerPrice: 500 }
            ];

            ProductV2.countDocuments.mockResolvedValue(1);
            ProductV2.find.mockReturnValue(mockChain(fakeProducts));
            ProductV2.aggregate.mockResolvedValue([
                {
                    data: [{ _id: 'prod-1', name: 'Green Sports Jersey', status: 'active', variants: fakeVariants }],
                    total: [{ count: 1 }]
                }
            ]);
            ProductVariant.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(fakeVariants) });
            Inventory.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const req = {
                url: 'http://localhost:3000/api/product/search?query=green',
                headers: { get: jest.fn(() => '127.0.0.1') }
            };
            const response = await searchProducts(req);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.products).toHaveLength(1);
        });
    });
});

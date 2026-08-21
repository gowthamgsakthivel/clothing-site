/**
 * Unit Tests for Product View & Matrix Helpers (lib/v2ProductView.js)
 */

import { buildColorSizeMatrix, getProductSummary, buildInventoryByVariantId } from '@/lib/v2ProductView';

describe('Product View & Matrix Helpers (lib/v2ProductView.js)', () => {
    const mockVariants = [
        {
            _id: 'var-1',
            productId: 'prod-1',
            sku: 'SP-DG-M',
            color: 'Dark Green',
            colorCode: '#006400',
            size: 'M',
            originalPrice: 1000,
            offerPrice: 800,
            images: ['https://example.com/green.jpg']
        },
        {
            _id: 'var-2',
            productId: 'prod-1',
            sku: 'SP-DG-L',
            color: 'Dark Green',
            colorCode: '#006400',
            size: 'L',
            originalPrice: 1000,
            offerPrice: 800,
            images: ['https://example.com/green.jpg']
        },
        {
            _id: 'var-3',
            productId: 'prod-1',
            sku: 'SP-NB-M',
            color: 'Navy Blue',
            colorCode: '#000080',
            size: 'M',
            originalPrice: 1200,
            offerPrice: 900,
            images: ['https://example.com/navy.jpg']
        }
    ];

    const mockInventories = [
        { variantId: 'var-1', totalStock: 10, reservedStock: 2, lowStockThreshold: 3 },
        { variantId: 'var-2', totalStock: 0, reservedStock: 0, lowStockThreshold: 3 },
        { variantId: 'var-3', totalStock: 5, reservedStock: 1, lowStockThreshold: 2 }
    ];

    test('buildInventoryByVariantId maps inventories by variant ID correctly', () => {
        const index = buildInventoryByVariantId(mockInventories);

        expect(index['var-1']).toBeDefined();
        expect(index['var-1'].totalStock).toBe(10);
        expect(index['var-1'].reservedStock).toBe(2);

        expect(index['var-2'].totalStock).toBe(0);
    });

    test('buildColorSizeMatrix groups variants by color with sizes and stock details', () => {
        const matrix = buildColorSizeMatrix(mockVariants, buildInventoryByVariantId(mockInventories));

        expect(matrix).toHaveLength(2); // Dark Green and Navy Blue

        const darkGreenGroup = matrix.find(g => g.color.name === 'Dark Green');
        expect(darkGreenGroup).toBeDefined();
        expect(darkGreenGroup.color.code).toBe('#006400');
        expect(darkGreenGroup.sizeStock).toHaveLength(2);

        const mSize = darkGreenGroup.sizeStock.find(s => s.size === 'M');
        expect(mSize).toBeDefined();
        expect(mSize.quantity).toBe(8);

        const lSize = darkGreenGroup.sizeStock.find(s => s.size === 'L');
        expect(lSize).toBeDefined();
        expect(lSize.quantity).toBe(0);
    });

    test('getProductSummary creates an accurate summary for bundle display', () => {
        const bundle = {
            product: {
                _id: 'prod-1',
                name: 'Pro Training Jersey',
                description: 'High performance sports jersey',
                category: 'Jerseys'
            },
            variants: mockVariants,
            inventoryByVariantId: buildInventoryByVariantId(mockInventories)
        };

        const summary = getProductSummary(bundle);

        expect(summary._id).toBe('prod-1');
        expect(summary.name).toBe('Pro Training Jersey');
        expect(summary.offerPrice).toBe(800); // lowest offer price
        expect(summary.price).toBe(1200); // max original price
        expect(summary.availableColors).toContain('Dark Green');
        expect(summary.availableColors).toContain('Navy Blue');
    });
});

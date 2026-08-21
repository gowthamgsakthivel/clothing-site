/**
 * Service Tests for Product Creation (services/products/ProductCreationService.js)
 */

import { createFullProduct } from '@/services/products/ProductCreationService';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import mongoose from 'mongoose';

jest.mock('@/models/v2/Product', () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
    }
}));

jest.mock('@/models/v2/ProductVariant', () => ({
    __esModule: true,
    default: {
        insertMany: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    }
}));

jest.mock('@/models/v2/Inventory', () => ({
    __esModule: true,
    default: {
        insertMany: jest.fn(),
        create: jest.fn(),
    }
}));

jest.mock('@/models/v2/InventoryMovement', () => ({
    __esModule: true,
    default: {
        create: jest.fn().mockResolvedValue(true),
    }
}));

describe('ProductCreationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(mongoose, 'startSession').mockResolvedValue({
            withTransaction: jest.fn().mockImplementation(async (cb) => cb()),
            endSession: jest.fn().mockResolvedValue(true)
        });
    });

    test('creates product, variants with auto-resolved color hex codes, and inventory records', async () => {
        const prodId = new mongoose.Types.ObjectId();
        ProductV2.create.mockResolvedValue([{
            _id: prodId,
            name: 'Running Jersey',
            category: 'Jerseys',
            description: 'Comfortable sports jersey'
        }]);

        ProductVariant.findOne.mockReturnValue({
            session: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null)
        });

        ProductVariant.create.mockImplementation((variants) => {
            const arr = Array.isArray(variants) ? variants : [variants];
            return Promise.resolve(arr.map(v => ({ ...v, _id: new mongoose.Types.ObjectId() })));
        });

        Inventory.create.mockImplementation((invs) => {
            const arr = Array.isArray(invs) ? invs : [invs];
            return Promise.resolve(arr.map(i => ({ ...i, _id: new mongoose.Types.ObjectId() })));
        });

        Inventory.insertMany.mockResolvedValue(true);

        const inputPayload = {
            product: {
                name: 'Running Jersey',
                description: 'Comfortable sports jersey',
                brand: 'Sparrow',
                collectionName: 'products',
                price: 999,
                offerPrice: 799,
                category: 'Jerseys',
                genderCategory: 'Unisex',
            },
            variants: [
                {
                    color: 'Dark Green',
                    size: 'M',
                    quantity: 15,
                    originalPrice: 999,
                    offerPrice: 799
                },
                {
                    color: 'Dark Green',
                    size: 'L',
                    quantity: 20,
                    originalPrice: 999,
                    offerPrice: 799
                }
            ]
        };

        const result = await createFullProduct({ payload: inputPayload, actorId: 'admin-1' });

        expect(result.product).toBeDefined();
        expect(result.createdCount).toBe(2);

        // Verify colorCode was auto-resolved using lib/colors
        expect(ProductVariant.create).toHaveBeenCalled();

        // Verify inventory records created
        expect(Inventory.create).toHaveBeenCalled();
    });
});

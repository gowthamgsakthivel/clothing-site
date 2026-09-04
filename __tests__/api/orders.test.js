/**
 * API Route Tests for Orders (app/api/orders/create & app/api/admin/orders/[id]/refund)
 */

import { POST as createOrderRoute } from '@/app/api/orders/create/route';
import { PATCH as updateRefundRoute } from '@/app/api/admin/orders/[id]/refund/route';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import OrderV2 from '@/models/v2/Order';
import User from '@/models/User';
import { createOrder, updateRefundStatus } from '@/services/orders/OrderService';
import { getAuth } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn()
}));

jest.mock('@/models/v2/Product', () => ({
    __esModule: true,
    default: {
        findById: jest.fn()
    }
}));

jest.mock('@/models/v2/ProductVariant', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn()
    }
}));

jest.mock('@/models/v2/Order', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn()
    }
}));

jest.mock('@/models/User', () => ({
    __esModule: true,
    default: {
        findByIdAndUpdate: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('@/services/orders/OrderService', () => ({
    createOrder: jest.fn(),
    updateRefundStatus: jest.fn()
}));

jest.mock('@/lib/authRoles', () => ({
    requireAdmin: jest.fn().mockResolvedValue(true)
}));

const mockLean = (data) => ({ lean: jest.fn().mockResolvedValue(data) });

describe('Orders API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/orders/create', () => {
        test('creates an order successfully with authenticated user', async () => {
            getAuth.mockReturnValue({ userId: 'user-123' });

            OrderV2.findOne.mockReturnValue(mockLean(null));
            ProductV2.findById.mockReturnValue(mockLean({ _id: 'prod-1', name: 'Jersey' }));
            ProductVariant.findOne.mockReturnValue(mockLean({
                _id: 'var-1',
                sku: 'SP-1',
                offerPrice: 500,
                originalPrice: 700
            }));

            createOrder.mockResolvedValue({ order: { _id: 'order-999' } });

            const req = {
                json: async () => ({
                    address: 'addr-1',
                    items: [{ product: 'prod-1', quantity: 2 }],
                    paymentMethod: 'Razorpay',
                    paymentStatus: 'Paid'
                })
            };

            const response = await createOrderRoute(req);
            const body = await response.json();

            expect(response.status).toBe(201);
            expect(body.success).toBe(true);
            expect(body.data.orderId).toBe('order-999');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user-123', { $set: { cartItems: {} } });
        });

        test('rejects unauthenticated requests with 401', async () => {
            getAuth.mockReturnValue({ userId: null });

            const response = await createOrderRoute({ json: async () => ({}) });
            const body = await response.json();

            expect(response.status).toBe(401);
            expect(body.success).toBe(false);
        });
    });

    describe('PATCH /api/admin/orders/[id]/refund', () => {
        test('updates refund status successfully', async () => {
            const validOrderId = '507f1f77bcf86cd799439011';
            updateRefundStatus.mockResolvedValue({
                order: { _id: validOrderId, refundStatus: 'completed' }
            });

            const req = {
                json: async () => ({
                    refundStatus: 'completed',
                    refundId: 'rfnd_abc'
                })
            };

            const response = await updateRefundRoute(req, { params: Promise.resolve({ id: validOrderId }) });
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(updateRefundStatus).toHaveBeenCalledWith(validOrderId, expect.objectContaining({
                refundStatus: 'completed',
                refundId: 'rfnd_abc'
            }));
        });
    });
});

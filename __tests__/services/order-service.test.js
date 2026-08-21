/**
 * Service Tests for Order Management (services/orders/OrderService.js)
 */

import { cancelOrder, updateRefundStatus, processRazorpayWebhook } from '@/services/orders/OrderService';
import OrderV2 from '@/models/v2/Order';
import Inventory from '@/models/v2/Inventory';
import Shipment from '@/models/v2/Shipment';
import WebhookEvent from '@/models/WebhookEvent';
import PaymentAudit from '@/models/PaymentAudit';
import mongoose from 'mongoose';

jest.mock('@/models/v2/Order', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(),
        findOne: jest.fn(),
    }
}));

jest.mock('@/models/v2/Shipment', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue(null) })
    }
}));

jest.mock('@/models/v2/Inventory', () => ({
    __esModule: true,
    default: {
        findOneAndUpdate: jest.fn(),
    }
}));

jest.mock('@/models/v2/InventoryMovement', () => ({
    __esModule: true,
    default: {
        create: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('@/models/WebhookEvent', () => ({
    __esModule: true,
    default: {
        create: jest.fn()
    }
}));

jest.mock('@/models/PaymentAudit', () => ({
    __esModule: true,
    default: {
        create: jest.fn()
    }
}));

describe('OrderService Workflows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(mongoose, 'startSession').mockResolvedValue({
            withTransaction: jest.fn().mockImplementation(async (cb) => cb()),
            endSession: jest.fn().mockResolvedValue(true)
        });
    });

    describe('cancelOrder', () => {
        test('cancels order, records cancellation reason, and releases inventory', async () => {
            const orderId = new mongoose.Types.ObjectId().toString();
            const fakeOrder = {
                _id: orderId,
                status: 'pending',
                items: [
                    { variantId: new mongoose.Types.ObjectId(), sku: 'SKU-1', quantity: 2 },
                    { variantId: new mongoose.Types.ObjectId(), sku: 'SKU-2', quantity: 1 }
                ],
                save: jest.fn().mockResolvedValue(true)
            };

            const mockQuery = Promise.resolve(fakeOrder);
            mockQuery.session = jest.fn().mockResolvedValue(fakeOrder);
            OrderV2.findById.mockReturnValue(mockQuery);

            Inventory.findOneAndUpdate.mockResolvedValue({ sku: 'SKU-1' });

            const result = await cancelOrder(orderId, {
                reason: 'Customer requested cancellation before dispatch',
                cancelledBy: 'admin',
                userId: 'admin-user'
            });

            expect(result.order).toBeDefined();
            expect(fakeOrder.status).toBe('cancelled');
            expect(fakeOrder.cancellationReason).toBe('Customer requested cancellation before dispatch');
            expect(fakeOrder.save).toHaveBeenCalled();
            expect(Inventory.findOneAndUpdate).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateRefundStatus', () => {
        test('updates refund status and paymentStatus to refunded', async () => {
            const orderId = new mongoose.Types.ObjectId().toString();
            const fakeOrder = {
                _id: orderId,
                status: 'cancelled',
                grandTotal: 1500,
                paymentMetadata: {},
                save: jest.fn().mockResolvedValue(true)
            };

            const mockQuery = Promise.resolve(fakeOrder);
            mockQuery.session = jest.fn().mockResolvedValue(fakeOrder);
            OrderV2.findById.mockReturnValue(mockQuery);

            const result = await updateRefundStatus(orderId, {
                refundStatus: 'completed',
                refundId: 'rfnd_123'
            });

            expect(result.order).toBeDefined();
            expect(fakeOrder.refundStatus).toBe('completed');
            expect(fakeOrder.paymentStatus).toBe('refunded');
            expect(fakeOrder.save).toHaveBeenCalled();
        });
    });

    describe('processRazorpayWebhook', () => {
        test('creates payment audit if no matching order found on captured event', async () => {
            OrderV2.findOne.mockResolvedValue(null);
            PaymentAudit.create.mockResolvedValue(true);

            const payload = {
                event: 'payment.captured',
                payload: {
                    payment: { entity: { id: 'pay_test', order_id: 'order_test' } }
                }
            };

            const result = await processRazorpayWebhook(payload, 'evt_test_1');

            expect(result.handled).toBe(false);
            expect(PaymentAudit.create).toHaveBeenCalled();
        });

        test('handles duplicate webhook event idempotently', async () => {
            const fakeOrder = {
                _id: new mongoose.Types.ObjectId(),
                paymentMetadata: { refunds: [] }
            };
            OrderV2.findOne.mockResolvedValue(fakeOrder);
            OrderV2.findById.mockReturnValue({
                session: jest.fn().mockResolvedValue({ ...fakeOrder, save: jest.fn().mockResolvedValue(true) })
            });

            const dupErr = new Error('duplicate key error');
            dupErr.code = 11000;
            WebhookEvent.create.mockRejectedValue(dupErr);

            const payload = {
                event: 'payment.captured',
                payload: {
                    payment: { entity: { id: 'pay_dup', order_id: 'order_dup' } }
                }
            };

            const result = await processRazorpayWebhook(payload, 'evt_dup');
            expect(result.handled).toBe(true);
        });

        test('processes refund.processed event and marks order refunded', async () => {
            const fakeOrder = {
                _id: new mongoose.Types.ObjectId(),
                paymentMetadata: { refunds: [] },
                save: jest.fn().mockResolvedValue(true)
            };
            OrderV2.findOne.mockResolvedValue(fakeOrder);
            WebhookEvent.create.mockResolvedValue(true);
            OrderV2.findById.mockReturnValue({
                session: jest.fn().mockResolvedValue(fakeOrder)
            });

            const payload = {
                event: 'refund.processed',
                payload: {
                    refund: { entity: { id: 'rfnd_abc', payment_id: 'pay_xyz', amount: 500 } }
                }
            };

            const result = await processRazorpayWebhook(payload, 'evt_refund_1');
            expect(result.handled).toBe(true);
            expect(fakeOrder.save).toHaveBeenCalled();
        });
    });
});

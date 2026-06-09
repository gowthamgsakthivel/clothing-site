/* eslint-env jest */
jest.mock('@/models/v2/Order');
jest.mock('@/models/WebhookEvent');
jest.mock('@/models/PaymentAudit');

const mongoose = require('mongoose');
const { processRazorpayWebhook } = require('@/services/orders/OrderService');
const OrderV2 = require('@/models/v2/Order');
const WebhookEvent = require('@/models/WebhookEvent');
const PaymentAudit = require('@/models/PaymentAudit');

describe('Razorpay webhook processing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('payment.captured with no matching order should create a payment audit', async () => {
    OrderV2.findOne = jest.fn().mockResolvedValue(null);
    PaymentAudit.create = jest.fn().mockResolvedValue(true);

    const payload = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123', order_id: 'order_abc' } } } };

    const result = await processRazorpayWebhook(payload, 'evt_1');

    expect(result.handled).toBe(false);
    expect(PaymentAudit.create).toHaveBeenCalled();
  });

  test('duplicate webhook delivery should be idempotent', async () => {
    const fakeOrder = { _id: mongoose.Types.ObjectId(), paymentMetadata: { refunds: [] } };
    OrderV2.findOne = jest.fn().mockResolvedValue(fakeOrder);

    // First call: WebhookEvent.create succeeds
    WebhookEvent.create = jest.fn().mockResolvedValue(true);
    OrderV2.findById = jest.fn().mockResolvedValue({ ...fakeOrder, save: jest.fn().mockResolvedValue(true) });

    const payload = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_dup', order_id: 'order_dup' } } } };

    const first = await processRazorpayWebhook(payload, 'evt_dup');
    expect(first.handled).toBe(true);

    // Second call: simulate duplicate key error from WebhookEvent.create
    const dupErr = new Error('duplicate key');
    dupErr.code = 11000;
    WebhookEvent.create = jest.fn().mockRejectedValue(dupErr);

    const second = await processRazorpayWebhook(payload, 'evt_dup');
    // Should still return {handled: true} because duplicate create implies already processed
    expect(second.handled).toBe(true);
  });

  test('refund.processed updates order to refunded', async () => {
    const fakeOrder = { _id: mongoose.Types.ObjectId(), paymentMetadata: { refunds: [] } };
    OrderV2.findOne = jest.fn().mockResolvedValue(fakeOrder);

    WebhookEvent.create = jest.fn().mockResolvedValue(true);

    const saved = { ...fakeOrder, save: jest.fn().mockResolvedValue(true) };
    OrderV2.findById = jest.fn().mockResolvedValue(saved);

    const payload = { event: 'refund.processed', payload: { refund: { entity: { id: 'ref_1', status: 'processed', amount: 100 } } } };

    const res = await processRazorpayWebhook(payload, 'evt_refund');
    expect(res.handled).toBe(true);
    expect(saved.save).toHaveBeenCalled();
  });
});

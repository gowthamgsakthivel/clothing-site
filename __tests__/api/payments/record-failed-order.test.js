/* eslint-env jest */
const createMock = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status || 200,
      json: async () => body
    })
  }
}));
jest.mock('@/lib/authRoles', () => ({
  requireUser: jest.fn()
}));
jest.mock('@/config/db', () => jest.fn().mockResolvedValue(true));
jest.mock('@/models/PaymentAudit', () => ({
  __esModule: true,
  default: {
    create: createMock
  }
}));

const { requireUser } = require('@/lib/authRoles');
const { POST } = require('@/app/api/payments/record-failed-order/route');

describe('record-failed-order fallback route', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('records payment audit with Razorpay payment details', async () => {
    requireUser.mockResolvedValue({ userId: 'user_123', role: 'user' });
    createMock.mockResolvedValue({ _id: 'audit_1' });

    const response = await POST({
      json: async () => ({
        razorpay_payment_id: 'pay_123',
        razorpay_order_id: 'order_123',
        amount: 499,
        errorMessage: 'Order creation failed'
      })
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'fallback:pay_123',
      razorpay_payment_id: 'pay_123',
      razorpay_order_id: 'order_123',
      amount: 499,
      userId: 'user_123',
      errorMessage: 'Order creation failed',
      reason: 'order_creation_failed_after_payment_verification'
    }));
  });

  test('rejects when payment identifiers are missing', async () => {
    requireUser.mockResolvedValue({ userId: 'user_123', role: 'user' });

    const response = await POST({
      json: async () => ({ amount: 499, errorMessage: 'Order creation failed' })
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });
});
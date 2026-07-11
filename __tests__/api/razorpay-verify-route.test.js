import '../mocks/nextjs';

const mockFindAuditOne = jest.fn();
const mockUpdateAuditOne = jest.fn();
const mockFindDesignById = jest.fn();
const mockUpdateDesignOne = jest.fn();

const resolveLean = (value) => ({
  lean: jest.fn().mockResolvedValue(value)
});

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn()
}));

jest.mock('@/config/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

jest.mock('@/models/PaymentAudit', () => ({
  __esModule: true,
  default: {
    findOne: (...args) => mockFindAuditOne(...args),
    updateOne: (...args) => mockUpdateAuditOne(...args)
  }
}));

jest.mock('@/models/CustomDesign', () => ({
  findById: (...args) => mockFindDesignById(...args),
  updateOne: (...args) => mockUpdateDesignOne(...args)
}));

const { getAuth } = require('@clerk/nextjs/server');
const { POST } = require('@/app/api/razorpay/verify/route');

const createSignature = (orderId, paymentId) => {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
};

describe('Razorpay verify route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_SECRET = 'secret_test';
  });

  test('returns 401 without an authenticated Clerk session', async () => {
    getAuth.mockReturnValue({ userId: null });

    const response = await POST({ json: async () => ({}) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  test('rejects malformed payloads', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    const response = await POST({ json: async () => ({ razorpay_order_id: '', razorpay_payment_id: '', razorpay_signature: 'bad' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid payment payload');
  });

  test('rejects signatures that do not match on the server', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    const response = await POST({
      json: async () => ({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'a'.repeat(64)
      })
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid signature');
    expect(mockFindAuditOne).not.toHaveBeenCalled();
  });

  test('rejects payments that do not belong to the authenticated user', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });
    mockFindAuditOne.mockReturnValue(resolveLean({
      _id: 'audit-1',
      userId: 'user-999',
      processed: false,
      amount: 499,
      payload: { sourceType: 'custom_design', sourceId: 'design-1' }
    }));

    const signature = createSignature('order_123', 'pay_123');
    const response = await POST({
      json: async () => ({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: signature
      })
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.message).toBe('Access denied');
    expect(mockUpdateAuditOne).not.toHaveBeenCalled();
  });

  test('verifies a matching payment for the authenticated user and updates the design record', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });
    mockFindAuditOne.mockReturnValue(resolveLean({
      _id: 'audit-1',
      userId: 'user-123',
      processed: false,
      amount: 499,
      payload: { sourceType: 'custom_design', sourceId: 'design-1' }
    }));
    mockFindDesignById.mockReturnValue(resolveLean({
      _id: 'design-1',
      user: 'user-123'
    }));
    mockUpdateDesignOne.mockResolvedValue({ acknowledged: true });
    mockUpdateAuditOne.mockResolvedValue({ acknowledged: true });

    const signature = createSignature('order_123', 'pay_123');
    const response = await POST({
      json: async () => ({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: signature
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdateDesignOne).toHaveBeenCalled();
    expect(mockUpdateAuditOne).toHaveBeenCalledWith(
      { _id: 'audit-1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          processed: true,
          reason: 'verified'
        })
      })
    );
  });
});
import '../mocks/nextjs';

const mockRazorpayCreate = jest.fn();
const mockFindUserById = jest.fn();
const mockFindProductById = jest.fn();
const mockFindVariantOne = jest.fn();
const mockFindDesignById = jest.fn();
const mockPaymentAuditCreate = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn()
}));

jest.mock('@/config/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

jest.mock('@/models/User', () => ({
  findById: (...args) => mockFindUserById(...args)
}));

jest.mock('@/models/v2/Product', () => ({
  findById: (...args) => mockFindProductById(...args)
}));

jest.mock('@/models/v2/ProductVariant', () => ({
  findOne: (...args) => mockFindVariantOne(...args)
}));

jest.mock('@/models/CustomDesign', () => ({
  findById: (...args) => mockFindDesignById(...args)
}));

jest.mock('@/models/PaymentAudit', () => ({
  __esModule: true,
  default: {
    create: (...args) => mockPaymentAuditCreate(...args)
  }
}));

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: (...args) => mockRazorpayCreate(...args)
    }
  }));
});

const { getAuth } = require('@clerk/nextjs/server');
const { POST } = require('@/app/api/razorpay/order/route');

const resolveLean = (value) => ({
  lean: jest.fn().mockResolvedValue(value)
});

describe('Razorpay order route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'key_test';
    process.env.RAZORPAY_KEY_SECRET = 'secret_test';
  });

  test('returns 401 without an authenticated Clerk session', async () => {
    getAuth.mockReturnValue({ userId: null });

    const response = await POST({ json: async () => ({}) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(mockRazorpayCreate).not.toHaveBeenCalled();
  });

  test('rejects malformed JSON bodies', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    const response = await POST({
      json: async () => {
        throw new Error('Unexpected token');
      }
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Malformed JSON body');
  });

  test('derives cart amount from the database and rejects mismatched client amounts', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    mockFindUserById.mockReturnValue(resolveLean({
      _id: 'user-123',
      cartItems: { 'product-1_red_M': 2 }
    }));
    mockFindProductById.mockReturnValue(resolveLean({ _id: 'product-1' }));
    mockFindVariantOne.mockImplementation((query) => {
      if (query?.color === 'red' && query?.size === 'M') {
        return resolveLean({ _id: 'variant-1', sku: 'SKU-1', offerPrice: 150, originalPrice: 200, visibility: 'visible' });
      }
      return resolveLean(null);
    });

    const response = await POST({
      json: async () => ({
        amount: 1,
        currency: 'INR'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Amount mismatch');
    expect(mockRazorpayCreate).not.toHaveBeenCalled();
  });

  test('creates a Razorpay order using server-side cart totals', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    mockFindUserById.mockReturnValue(resolveLean({
      _id: 'user-123',
      cartItems: { 'product-1_red_M': 2 }
    }));
    mockFindProductById.mockReturnValue(resolveLean({ _id: 'product-1' }));
    mockFindVariantOne.mockImplementation((query) => {
      if (query?.color === 'red' && query?.size === 'M') {
        return resolveLean({ _id: 'variant-1', sku: 'SKU-1', offerPrice: 150, originalPrice: 200, visibility: 'visible' });
      }
      return resolveLean(null);
    });
    mockRazorpayCreate.mockResolvedValue({ id: 'order_abc', amount: 30600, currency: 'INR' });
    mockPaymentAuditCreate.mockResolvedValue({ _id: 'audit_1' });

    const response = await POST({
      json: async () => ({
        currency: 'INR'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockRazorpayCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 30600,
      currency: 'INR'
    }));
    expect(mockPaymentAuditCreate).toHaveBeenCalledWith(expect.objectContaining({
      razorpay_order_id: 'order_abc',
      amount: 306,
      userId: 'user-123'
    }));
  });

  test('derives custom design amount from the authenticated user record', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    mockFindDesignById.mockReturnValue(resolveLean({
      _id: 'design-123',
      user: 'user-123',
      status: 'approved',
      quote: { amount: 499 }
    }));
    mockRazorpayCreate.mockResolvedValue({ id: 'order_custom', amount: 49900, currency: 'INR' });
    mockPaymentAuditCreate.mockResolvedValue({ _id: 'audit_2' });

    const response = await POST({
      json: async () => ({
        currency: 'INR',
        customDesignId: 'design-123'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockRazorpayCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 49900,
      receipt: 'custom_design_design-123'
    }));
  });
});
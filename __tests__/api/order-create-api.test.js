/**
 * Order Creation API Tests (v2)
 */

import '../mocks/nextjs';

import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Product from '@/models/Product';
import CustomDesign from '@/models/CustomDesign';
import { createOrder } from '@/services/orders/OrderService';

jest.mock('@/config/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
  connectDB: jest.fn().mockResolvedValue(true)
}));

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn()
}));

jest.mock('@/services/orders/OrderService', () => ({
  createOrder: jest.fn()
}));

jest.mock('@/models/v2/Product', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('@/models/v2/ProductVariant', () => ({
  findOne: jest.fn()
}));

jest.mock('@/models/Product', () => ({
  findById: jest.fn()
}));

jest.mock('@/models/CustomDesign', () => ({
  findById: jest.fn(),
  updateMany: jest.fn()
}));

import { getAuth } from '@clerk/nextjs/server';
const { POST } = require('@/app/api/orders-v2/create/route');

const mockLean = (value) => ({
  lean: jest.fn().mockResolvedValue(value)
});

describe('Order Creation API (v2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a new order successfully with v2 product id', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    ProductV2.findById.mockReturnValue(mockLean({ _id: 'prod-v2-1', name: 'V2 Product' }));
    ProductVariant.findOne.mockReturnValue(mockLean({
      _id: 'variant-1',
      productId: 'prod-v2-1',
      sku: 'SKU-1',
      offerPrice: 120,
      originalPrice: 150
    }));

    createOrder.mockResolvedValue({ order: { _id: 'order-1' } });

    const req = {
      json: async () => ({
        address: 'address-1',
        items: [{ product: 'prod-v2-1', quantity: 2 }],
        paymentMethod: 'Razorpay',
        paymentStatus: 'Paid'
      })
    };

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.orderId).toBe('order-1');

    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        paymentMethod: 'Razorpay',
        paymentStatus: 'Paid',
        shippingAddressId: 'address-1',
        items: [
          expect.objectContaining({
            variantId: 'variant-1',
            sku: 'SKU-1',
            quantity: 2,
            unitPrice: 120,
            totalPrice: 240
          })
        ]
      })
    );
  });

  test('returns error when required data is missing', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    const reqWithoutAddress = {
      json: async () => ({
        items: [{ product: 'prod-v2-1', quantity: 2 }]
      })
    };

    const response1 = await POST(reqWithoutAddress);
    const data1 = await response1.json();

    expect(response1.status).toBe(400);
    expect(data1.success).toBe(false);
    expect(data1.message).toBe('Invalid data');

    const reqWithEmptyItems = {
      json: async () => ({
        address: 'address-1',
        items: []
      })
    };

    const response2 = await POST(reqWithEmptyItems);
    const data2 = await response2.json();

    expect(response2.status).toBe(400);
    expect(data2.success).toBe(false);
    expect(data2.message).toBe('Invalid data');
  });

  test('returns error when product not found', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });
    ProductV2.findById.mockReturnValue(mockLean(null));
    ProductV2.findOne.mockReturnValue(mockLean(null));

    const req = {
      json: async () => ({
        address: 'address-1',
        items: [{ product: 'prod-v2-1', quantity: 1 }]
      })
    };

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Product not found');
  });

  test('returns error for invalid quantity', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    ProductV2.findById.mockReturnValue(mockLean({ _id: 'prod-v2-1', name: 'V2 Product' }));
    ProductVariant.findOne.mockReturnValue(mockLean({
      _id: 'variant-1',
      productId: 'prod-v2-1',
      sku: 'SKU-1',
      offerPrice: 120,
      originalPrice: 150
    }));

    const req = {
      json: async () => ({
        address: 'address-1',
        items: [{ product: 'prod-v2-1', quantity: 0 }]
      })
    };

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid quantity');
  });

  test('returns error for unapproved custom design', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    CustomDesign.findById.mockReturnValue(mockLean({
      _id: 'custom-123',
      user: 'user-123',
      status: 'quoted',
      quote: { amount: 250 },
      quantity: 1
    }));

    const req = {
      json: async () => ({
        address: 'address-1',
        items: [{ product: 'custom_123', quantity: 1 }]
      })
    };

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Custom design is not approved yet.');
  });

  test('handles service errors gracefully', async () => {
    getAuth.mockReturnValue({ userId: 'user-123' });

    ProductV2.findById.mockReturnValue(mockLean({ _id: 'prod-v2-1', name: 'V2 Product' }));
    ProductVariant.findOne.mockReturnValue(mockLean({
      _id: 'variant-1',
      productId: 'prod-v2-1',
      sku: 'SKU-1',
      offerPrice: 120,
      originalPrice: 150
    }));

    createOrder.mockRejectedValue({ message: 'Database connection failed', status: 500 });

    const req = {
      json: async () => ({
        address: 'address-1',
        items: [{ product: 'prod-v2-1', quantity: 1 }]
      })
    };

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Database connection failed');
  });
});

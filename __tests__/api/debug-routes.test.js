import '../mocks/nextjs';

const mockAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: (...args) => mockAuth(...args)
}));

const { GET: getClaims } = require('@/app/api/debug/claims/route');
const { GET: getCart } = require('@/app/api/debug/cart/route');

describe('debug routes', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('returns 404 in production for claims and cart debug routes', async () => {
    process.env.NODE_ENV = 'production';

    const claimsResponse = await getClaims();
    const cartResponse = await getCart();

    expect(claimsResponse.status).toBe(404);
    expect(cartResponse.status).toBe(404);
  });

  test('requires auth in development', async () => {
    process.env.NODE_ENV = 'development';
    mockAuth.mockResolvedValue({ userId: null });

    const response = await getClaims();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
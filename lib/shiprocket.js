import connectDB from "@/config/db";
import ShiprocketToken from "@/models/ShiprocketToken";
import logger from "@/lib/logger";

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const TOKEN_TTL_HOURS = Number(process.env.SHIPROCKET_TOKEN_TTL_HOURS || '240');
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

let cachedToken = null;
let tokenExpiresAt = 0;

const clearTokenCache = async () => {
  cachedToken = null;
  tokenExpiresAt = 0;
  await connectDB();
  await ShiprocketToken.deleteMany({});
};

const getShiprocketToken = async () => {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now) {
    return cachedToken;
  }

  await connectDB();
  const existingToken = await ShiprocketToken.findOne({
    expiresAt: { $gt: new Date(now + TOKEN_REFRESH_BUFFER_MS) }
  }).sort({ createdAt: -1 }).lean();

  if (existingToken?.token) {
    cachedToken = existingToken.token;
    tokenExpiresAt = new Date(existingToken.expiresAt).getTime();
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials are not configured');
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shiprocket auth failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const token = data?.token;

  if (!token) {
    throw new Error('Shiprocket auth failed: token missing');
  }

  const expiresAt = new Date(now + TOKEN_TTL_HOURS * 60 * 60 * 1000);
  await ShiprocketToken.create({ token, expiresAt });

  cachedToken = token;
  tokenExpiresAt = expiresAt.getTime();
  return cachedToken;
};

const shiprocketRequest = async (path, options = {}, retryOnce = false) => {
  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401 && !retryOnce) {
    await clearTokenCache();
    logger.info('shiprocket.auth.refresh', { reason: 'unauthorized', scope: 'shiprocketRequest' });
    return shiprocketRequest(path, options, true);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shiprocket request failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

const createShiprocketOrder = async (payload) => {
  return shiprocketRequest('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

const assignShiprocketAwb = async ({ shipmentId, courierCompanyId }) => {
  return shiprocketRequest('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_company_id: courierCompanyId
    })
  });
};

const trackShiprocketShipment = async ({ awbCode }) => {
  return shiprocketRequest(`/courier/track/awb/${encodeURIComponent(awbCode)}`, {
    method: 'GET'
  });
};

export {
  getShiprocketToken,
  createShiprocketOrder,
  assignShiprocketAwb,
  trackShiprocketShipment
};

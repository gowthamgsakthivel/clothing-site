import axios from 'axios';
import connectDB from '@/config/db';
import Address from '@/models/Address';
import User from '@/models/User';
import logger from '@/lib/logger';

const API_BASE = 'https://apiv2.shiprocket.in/v1/external';

let tokenCache = {
  token: null,
  expiresAt: 0
};

const clearTokenCache = () => {
  tokenCache = { token: null, expiresAt: 0 };
};

const isTokenValid = () => {
  return tokenCache.token && Date.now() < tokenCache.expiresAt;
};

const authenticate = async () => {
  try {
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      return {
        success: false,
        error: 'Shiprocket credentials are not configured'
      };
    }

    if (isTokenValid()) {
      return { success: true, data: { token: tokenCache.token } };
    }

    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    });

    const token = response?.data?.token;
    if (!token) {
      return { success: false, error: 'Shiprocket authentication failed' };
    }

    const ttlHours = Number.parseInt(process.env.SHIPROCKET_TOKEN_TTL_HOURS || '24', 10);
    tokenCache = {
      token,
      expiresAt: Date.now() + ttlHours * 60 * 60 * 1000
    };

    return { success: true, data: { token } };
  } catch (error) {
    logger.error('shiprocket.auth.error', { message: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'Shiprocket authentication error'
    };
  }
};

const DEFAULT_PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION
  || '12, sivagananam st, Ganesapuram, kamaraj Nagar, Namakkal, thulir fertility center, Namakkal, Tamil Nadu, India, 637001';
const DEFAULT_LENGTH = Number.parseFloat(process.env.SHIPROCKET_PKG_LENGTH || '25');
const DEFAULT_BREADTH = Number.parseFloat(process.env.SHIPROCKET_PKG_BREADTH || '20');
const DEFAULT_HEIGHT = Number.parseFloat(process.env.SHIPROCKET_PKG_HEIGHT || '3');
const DEFAULT_WEIGHT = Number.parseFloat(process.env.SHIPROCKET_PKG_WEIGHT || '0.3');
const DEFAULT_COUNTRY = process.env.SHIPROCKET_DEFAULT_COUNTRY || 'India';
const DEFAULT_EMAIL = process.env.SHIPROCKET_DEFAULT_EMAIL || '';

const normalizePaymentMethod = (value) => {
  const normalized = (value || '').toString().trim().toLowerCase();
  return normalized === 'cod' ? 'COD' : 'Prepaid';
};

const formatOrderDate = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const buildShiprocketPayload = async (order, packageDetails = null) => {
  await connectDB();

  const [address, user] = await Promise.all([
    order?.shippingAddressId ? Address.findById(order.shippingAddressId).lean() : null,
    order?.userId ? User.findById(order.userId).lean() : null
  ]);

  if (!address) {
    return { success: false, error: 'Shipping address not found' };
  }

  const customerName = address?.fullName || user?.name || 'Customer';
  const customerPhone = address?.phoneNumber || '';
  const customerEmail = user?.email || DEFAULT_EMAIL;

  if (!customerPhone) {
    return { success: false, error: 'Customer phone number is required for Shiprocket' };
  }

  if (!customerEmail) {
    return { success: false, error: 'Customer email is required for Shiprocket' };
  }

  const items = Array.isArray(order?.items)
    ? order.items.map((item, index) => ({
      name: item?.designName || item?.sku || `Item ${index + 1}`,
      sku: item?.sku || `item_${index + 1}`,
      units: Number(item?.quantity || 1),
      selling_price: Number(item?.unitPrice || 0),
      discount: 0,
      tax: 0
    }))
    : [];

  if (!items.length) {
    return { success: false, error: 'Order items are required for Shiprocket' };
  }

  const safeLength = Number(packageDetails?.lengthCm);
  const safeBreadth = Number(packageDetails?.breadthCm);
  const safeHeight = Number(packageDetails?.heightCm);
  const safeWeight = Number(packageDetails?.chargeableWeightKg || packageDetails?.weightKg);

  return {
    success: true,
    payload: {
      order_id: order?._id?.toString() || order?.orderId || `order-${Date.now()}`,
      order_date: formatOrderDate(order?.createdAt),
      pickup_location: DEFAULT_PICKUP_LOCATION,
      channel_id: order?.channelId || undefined,
      billing_customer_name: customerName,
      billing_last_name: '',
      billing_address: address?.area || 'Address',
      billing_address_2: '',
      billing_city: address?.city || 'City',
      billing_pincode: address?.pincode || '000000',
      billing_state: address?.state || 'State',
      billing_country: DEFAULT_COUNTRY,
      billing_email: customerEmail,
      billing_phone: customerPhone,
      shipping_is_billing: true,
      order_items: items,
      payment_method: normalizePaymentMethod(order?.paymentMethod),
      shipping_charges: Number(order?.shippingTotal || 0),
      total_discount: Number(order?.discountTotal || 0),
      sub_total: Number(order?.subtotal || 0),
      length: Number.isFinite(safeLength) && safeLength > 0 ? safeLength : (Number.isFinite(DEFAULT_LENGTH) ? DEFAULT_LENGTH : 25),
      breadth: Number.isFinite(safeBreadth) && safeBreadth > 0 ? safeBreadth : (Number.isFinite(DEFAULT_BREADTH) ? DEFAULT_BREADTH : 20),
      height: Number.isFinite(safeHeight) && safeHeight > 0 ? safeHeight : (Number.isFinite(DEFAULT_HEIGHT) ? DEFAULT_HEIGHT : 3),
      weight: Number.isFinite(safeWeight) && safeWeight > 0 ? safeWeight : (Number.isFinite(DEFAULT_WEIGHT) ? DEFAULT_WEIGHT : 0.3)
    }
  };
};

const createShipment = async (order, packageDetails = null, retryOnce = false) => {
  try {
    const payloadResult = await buildShiprocketPayload(order, packageDetails);
    if (!payloadResult.success) {
      return payloadResult;
    }

    const auth = await authenticate();
    if (!auth.success) {
      return auth;
    }

    const response = await axios.post(
      `${API_BASE}/orders/create/adhoc`,
      payloadResult.payload,
      {
        headers: {
          Authorization: `Bearer ${auth.data.token}`
        }
      }
    );

    return { success: true, data: response.data, payload: payloadResult.payload };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 && !retryOnce) {
      clearTokenCache();
      logger.info('shiprocket.auth.refresh', { reason: 'unauthorized', scope: 'createShipment' });
      return createShipment(order, packageDetails, true);
    }
    logger.error('shiprocket.createShipment.error', { message: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'Shiprocket create shipment error'
    };
  }
};

const assignAwb = async ({ shipmentId, courierCompanyId }, retryOnce = false) => {
  try {
    const auth = await authenticate();
    if (!auth.success) {
      return auth;
    }

    const response = await axios.post(
      `${API_BASE}/courier/assign/awb`,
      {
        shipment_id: shipmentId,
        courier_company_id: courierCompanyId
      },
      {
        headers: {
          Authorization: `Bearer ${auth.data.token}`
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 && !retryOnce) {
      clearTokenCache();
      logger.info('shiprocket.auth.refresh', { reason: 'unauthorized', scope: 'assignAwb' });
      return assignAwb({ shipmentId, courierCompanyId }, true);
    }
    logger.error('shiprocket.assignAwb.error', { message: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'Shiprocket AWB assignment error'
    };
  }
};

const generateLabel = async ({ shipmentId }, retryOnce = false) => {
  try {
    const auth = await authenticate();
    if (!auth.success) {
      return auth;
    }

    const response = await axios.post(
      `${API_BASE}/courier/generate/label`,
      {
        shipment_id: [shipmentId]
      },
      {
        headers: {
          Authorization: `Bearer ${auth.data.token}`
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 && !retryOnce) {
      clearTokenCache();
      logger.info('shiprocket.auth.refresh', { reason: 'unauthorized', scope: 'generateLabel' });
      return generateLabel({ shipmentId }, true);
    }
    logger.error('shiprocket.generateLabel.error', { message: error?.message });
    return {
      success: false,
      error: error?.response?.data?.message || error?.message || 'Shiprocket Label generation error'
    };
  }
};

export { authenticate, createShipment, assignAwb, generateLabel };

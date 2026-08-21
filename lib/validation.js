const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const requireFields = (payload, fields = []) => {
  const missing = fields.filter((field) => payload?.[field] === undefined || payload?.[field] === null || payload?.[field] === '');
  return missing;
};

const validateOrderPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Invalid payload structure' };
  }
  if (!payload.address) {
    return { valid: false, message: 'Shipping address is required' };
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { valid: false, message: 'Cart items cannot be empty' };
  }

  for (let i = 0; i < payload.items.length; i++) {
    const item = payload.items[i];
    if (!item || !item.product) {
      return { valid: false, message: `Item at index ${i} is missing product reference` };
    }
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return { valid: false, message: `Item at index ${i} has invalid quantity` };
    }
  }

  return { valid: true };
};

const validateAddressPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Invalid address payload' };
  }
  const required = ['name', 'phone', 'street', 'city', 'pincode'];
  const missing = requireFields(payload, required);
  if (missing.length > 0) {
    return { valid: false, message: `Missing required address fields: ${missing.join(', ')}` };
  }
  return { valid: true };
};

export { isNonEmptyString, toNumber, requireFields, validateOrderPayload, validateAddressPayload };


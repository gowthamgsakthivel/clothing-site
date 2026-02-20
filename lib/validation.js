const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const requireFields = (payload, fields = []) => {
  const missing = fields.filter((field) => payload?.[field] === undefined || payload?.[field] === null || payload?.[field] === '');
  return missing;
};

export { isNonEmptyString, toNumber, requireFields };

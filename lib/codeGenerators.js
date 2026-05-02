// `CodeCounter` is a server-side mongoose model. Avoid importing it at
// module top-level so client bundles ("use client") don't evaluate
// server-only code and cause `mongoose` to be undefined.

const GENDER_CODE_MAP = {
  Men: 'M',
  Women: 'W',
  Kids: 'K',
  Boys: 'B',
  Girls: 'G',
  Unisex: 'U'
};

const COLOR_CODE_MAP = {
  BLACK: 'BLK',
  WHITE: 'WHT',
  RED: 'RED',
  BLUE: 'BLU',
  GREEN: 'GRN',
  YELLOW: 'YLW',
  ORANGE: 'ORG',
  PINK: 'PNK',
  PURPLE: 'PRP',
  GREY: 'GRY',
  GRAY: 'GRY',
  NAVY: 'NVY',
  BROWN: 'BRN',
  MAROON: 'MRN',
  TEAL: 'TEL',
  CYAN: 'CYN',
  BEIGE: 'BGE',
  GOLD: 'GLD',
  SILVER: 'SLV',
  BLK: 'BLK'
};

const cleanSegment = (value) => (value || '')
  .toString()
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9\s-]/g, '');

const getWordInitials = (value, fallback = 'PR') => {
  const segments = cleanSegment(value)
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  if (!segments.length) return fallback;

  const initials = segments.map((segment) => segment[0]).join('').slice(0, 3);
  return (initials || fallback).padEnd(2, fallback[0] || 'P');
};

const getGenderCode = (value) => GENDER_CODE_MAP[value] || getWordInitials(value, 'U');

const getColorCode = (value) => {
  const normalized = cleanSegment(value).replace(/\s+/g, '');
  return COLOR_CODE_MAP[normalized] || normalized.slice(0, 3).padEnd(3, 'X') || 'BLK';
};

const getSizeCode = (value) => cleanSegment(value).replace(/\s+/g, '').slice(0, 3).padEnd(2, 'X') || 'STD';

const getCategoryCode = (value) => getWordInitials(value, 'PR');

const buildProductPrefix = ({ category, genderCategory, color, size }) => {
  const categoryCode = getCategoryCode(category);
  const genderCode = getGenderCode(genderCategory);
  const colorCode = getColorCode(color || 'BLACK');
  const sizeCode = getSizeCode(size || 'STD');

  return `${categoryCode}-${genderCode}-${colorCode}-${sizeCode}`;
};

const incrementCounter = async ({ key, session = null }) => {
  if (typeof window !== 'undefined') {
    throw new Error('incrementCounter is server-only and cannot run in the browser');
  }

  const { default: CodeCounter } = await import('@/models/CodeCounter');

  const result = await CodeCounter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session
    }
  );

  return result?.seq || 1;
};

const generateProductCode = async ({ category, genderCategory, color, size, session = null }) => {
  const prefix = buildProductPrefix({ category, genderCategory, color, size });
  const sequence = await incrementCounter({ key: `product:${prefix}`, session });
  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

const generateOrderCode = async ({ date = new Date(), session = null }) => {
  const currentDate = date instanceof Date ? date : new Date(date);
  const year = String(currentDate.getFullYear()).slice(-2);
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const prefix = `${year}${month}${day}`;
  const sequence = await incrementCounter({ key: `order:${prefix}`, session });
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

const getDisplayCode = (value, fallbackId = null, fallbackLength = 8) => {
  if (value) return value;
  if (!fallbackId) return 'N/A';
  return String(fallbackId).slice(-fallbackLength).toUpperCase();
};

const getDisplayOrderCode = (order) => getDisplayCode(order?.orderCode, order?._id, 8);
const getDisplayProductCode = (product) => getDisplayCode(product?.productCode, product?._id, 8);

export {
  buildProductPrefix,
  generateProductCode,
  generateOrderCode,
  getDisplayOrderCode,
  getDisplayProductCode
};
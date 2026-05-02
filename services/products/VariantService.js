import connectDB from '@/config/db';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import logger from '@/lib/logger';
import { buildError } from '@/lib/errors';
import { requireFields, isNonEmptyString, toNumber } from '@/lib/validation';

const VISIBILITY_VALUES = ['visible', 'hidden'];
const isValidColorCode = (value) => /^#[0-9A-Fa-f]{6}$/.test(value);

const toCode = (value, length, fallback = 'X') => {
  const cleaned = (value || '')
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return cleaned.slice(0, length).padEnd(length, fallback);
};

const buildProductCode = (product) => {
  const categoryCode = toCode(product?.category || 'PRO', 3);
  const brandCode = toCode(product?.brand || 'BRD', 3);
  return `${categoryCode}-${brandCode}`;
};

const buildSku = ({ productCode, color, size }) => {
  const colorCode = toCode(color, 3);
  const sizeCode = toCode(size, 2);
  return `SS-${productCode}-${colorCode}-${sizeCode}`;
};

const ensureSkuUnique = async (sku, excludeId = null) => {
  const query = { sku };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await ProductVariant.findOne(query).lean();
  return !existing;
};

const ensureColorSizeUnique = async ({ productId, color, size, excludeId = null }) => {
  const query = { productId, color, size };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await ProductVariant.findOne(query).lean();
  return !existing;
};

const createVariant = async (productId, data) => {
  await connectDB();

  const product = await ProductV2.findById(productId).lean();
  if (!product) {
    throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
  }

  const color = data?.color?.trim();
  const colorCode = data?.colorCode ? data.colorCode.trim() : null;
  const size = data?.size?.trim();
  const originalPrice = toNumber(data?.originalPrice);
  const offerPrice = toNumber(data?.offerPrice ?? data?.originalPrice);
  const images = Array.isArray(data?.images) ? data.images.filter(isNonEmptyString) : [];
  const visibility = data?.visibility || 'visible';

  const missing = requireFields({ color, colorCode, size, originalPrice }, ['color', 'colorCode', 'size', 'originalPrice']);
  if (missing.length) {
    throw buildError({ message: 'Missing required fields', status: 400, code: 'MISSING_FIELDS', details: missing });
  }

  if (!VISIBILITY_VALUES.includes(visibility)) {
    throw buildError({ message: 'Invalid visibility value', status: 400, code: 'INVALID_VISIBILITY' });
  }

  if (colorCode && !isValidColorCode(colorCode)) {
    throw buildError({ message: 'Invalid color code value', status: 400, code: 'INVALID_COLOR_CODE' });
  }

  const colorSizeUnique = await ensureColorSizeUnique({ productId, color, size });
  if (!colorSizeUnique) {
    throw buildError({ message: 'Variant color and size must be unique per product', status: 409, code: 'DUPLICATE_VARIANT' });
  }

  const productCode = buildProductCode(product);
  const sku = data?.sku ? data.sku.trim().toUpperCase() : buildSku({ productCode, color, size });
  const skuUnique = await ensureSkuUnique(sku);
  if (!skuUnique) {
    throw buildError({ message: 'SKU must be unique', status: 409, code: 'SKU_EXISTS' });
  }

  const variant = await ProductVariant.create({
    productId,
    color,
    colorCode,
    size,
    sku,
    originalPrice,
    offerPrice,
    visibility,
    images
  });

  const inventoryExists = await Inventory.findOne({ variantId: variant._id }).lean();
  if (!inventoryExists) {
    await Inventory.create({
      variantId: variant._id,
      sku,
      totalStock: 0,
      reservedStock: 0,
      lowStockThreshold: 5
    });
  }

  logger.info('variants.v2.create', { variantId: variant._id, productId });

  return { variant };
};

const updateVariant = async (variantId, data) => {
  await connectDB();

  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    throw buildError({ message: 'Variant not found', status: 404, code: 'VARIANT_NOT_FOUND' });
  }

  const nextColor = data?.color ? data.color.trim() : variant.color;
  const nextSize = data?.size ? data.size.trim() : variant.size;

  if (data?.color || data?.size) {
    const colorSizeUnique = await ensureColorSizeUnique({
      productId: variant.productId,
      color: nextColor,
      size: nextSize,
      excludeId: variantId
    });
    if (!colorSizeUnique) {
      throw buildError({ message: 'Variant color and size must be unique per product', status: 409, code: 'DUPLICATE_VARIANT' });
    }
  }

  if (data?.sku) {
    const sku = data.sku.trim().toUpperCase();
    const skuUnique = await ensureSkuUnique(sku, variantId);
    if (!skuUnique) {
      throw buildError({ message: 'SKU must be unique', status: 409, code: 'SKU_EXISTS' });
    }
    variant.sku = sku;
  } else if (data?.color || data?.size) {
    const product = await ProductV2.findById(variant.productId).lean();
    if (!product) {
      throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
    }
    const productCode = buildProductCode(product);
    const sku = buildSku({ productCode, color: nextColor, size: nextSize });
    const skuUnique = await ensureSkuUnique(sku, variantId);
    if (!skuUnique) {
      throw buildError({ message: 'SKU must be unique', status: 409, code: 'SKU_EXISTS' });
    }
    variant.sku = sku;
  }

  if (data?.color) variant.color = nextColor;
  if (data?.colorCode !== undefined) {
    const nextColorCode = data.colorCode ? data.colorCode.trim() : null;
    if (nextColorCode && !isValidColorCode(nextColorCode)) {
      throw buildError({ message: 'Invalid color code value', status: 400, code: 'INVALID_COLOR_CODE' });
    }
    variant.colorCode = nextColorCode;
  }
  if (data?.size) variant.size = nextSize;
  if (data?.originalPrice !== undefined) variant.originalPrice = toNumber(data.originalPrice, variant.originalPrice);
  if (data?.offerPrice !== undefined) variant.offerPrice = toNumber(data.offerPrice, variant.offerPrice);
  if (Array.isArray(data?.images)) variant.images = data.images.filter(isNonEmptyString);
  if (data?.visibility) {
    if (!VISIBILITY_VALUES.includes(data.visibility)) {
      throw buildError({ message: 'Invalid visibility value', status: 400, code: 'INVALID_VISIBILITY' });
    }
    variant.visibility = data.visibility;
  }

  await variant.save();
  logger.info('variants.v2.update', { variantId });

  return { variant };
};

const deleteVariant = async (variantId) => {
  await connectDB();

  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    throw buildError({ message: 'Variant not found', status: 404, code: 'VARIANT_NOT_FOUND' });
  }

  variant.visibility = 'hidden';
  await variant.save();
  logger.info('variants.v2.delete', { variantId });

  return { variant };
};

const getVariantsByProduct = async (productId) => {
  await connectDB();

  const product = await ProductV2.findById(productId).lean();
  if (!product) {
    throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
  }

  const variants = await ProductVariant.find({ productId }).lean();

  return { variants };
};

export {
  createVariant,
  updateVariant,
  deleteVariant,
  getVariantsByProduct
};

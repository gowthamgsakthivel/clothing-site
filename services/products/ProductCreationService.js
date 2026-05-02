import mongoose from 'mongoose';
import connectDB from '@/config/db';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import InventoryMovement from '@/models/v2/InventoryMovement';
import logger from '@/lib/logger';
import { buildError } from '@/lib/errors';
import { requireFields, isNonEmptyString, toNumber } from '@/lib/validation';
import { generateProductCode } from '@/lib/codeGenerators';

const STATUS_VALUES = ['draft', 'active', 'hidden', 'archived'];
const SPORT_CATEGORIES = ['cricket', 'football', 'basketball', 'badminton', 'tennis', 'gym'];
const isValidColorCode = (value) => /^#[0-9A-Fa-f]{6}$/.test(value);

const slugify = (value) => {
  if (!value) return 'product';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product';
};

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

const isValidImageUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const normalizeVariants = (variants) => {
  if (!Array.isArray(variants) || !variants.length) {
    throw buildError({ message: 'Variants are required', status: 400, code: 'VARIANTS_REQUIRED' });
  }

  return variants.map((variant, index) => {
    const color = variant?.color?.trim();
    const colorCode = variant?.colorCode ? variant.colorCode.trim() : null;
    const size = variant?.size?.trim();
    const originalPrice = toNumber(variant?.originalPrice);
    const offerPrice = toNumber(variant?.offerPrice ?? variant?.originalPrice);
    const images = Array.isArray(variant?.images) ? variant.images.filter(isNonEmptyString) : [];
    const quantity = Math.max(0, toNumber(variant?.quantity, 0));

    const missing = requireFields({ color, colorCode, size, originalPrice }, ['color', 'colorCode', 'size', 'originalPrice']);
    if (missing.length) {
      throw buildError({
        message: `Missing required variant fields for item ${index + 1}`,
        status: 400,
        code: 'VARIANT_MISSING_FIELDS',
        details: missing
      });
    }

    if (!images.length || !images.every(isValidImageUrl)) {
      throw buildError({ message: 'Variant images must be valid URLs', status: 400, code: 'INVALID_IMAGE_URL' });
    }

    if (colorCode && !isValidColorCode(colorCode)) {
      throw buildError({ message: 'Invalid color code value', status: 400, code: 'INVALID_COLOR_CODE' });
    }

    return {
      color,
      colorCode,
      size,
      originalPrice,
      offerPrice,
      images,
      quantity
    };
  });
};

const createVariantsWithInventory = async ({
  session,
  product,
  variants,
  actorId,
  reference
}) => {
  const normalizedVariants = normalizeVariants(variants);
  const productCode = product?.productCode || buildProductCode(product);

  for (const variantData of normalizedVariants) {
    const sku = buildSku({
      productCode,
      color: variantData.color,
      size: variantData.size
    });

    const existingSku = await ProductVariant.findOne({ sku }).session(session).lean();
    if (existingSku) {
      throw buildError({ message: 'SKU must be unique', status: 409, code: 'SKU_EXISTS' });
    }

    const existingVariant = await ProductVariant.findOne({
      productId: product._id,
      color: variantData.color,
      size: variantData.size
    }).session(session).lean();

    if (existingVariant) {
      throw buildError({ message: 'Variant color and size must be unique per product', status: 409, code: 'DUPLICATE_VARIANT' });
    }

    const [createdVariant] = await ProductVariant.create([
      {
        productId: product._id,
        color: variantData.color,
        colorCode: variantData.colorCode,
        size: variantData.size,
        sku,
        originalPrice: variantData.originalPrice,
        offerPrice: variantData.offerPrice,
        visibility: 'visible',
        images: variantData.images
      }
    ], { session });

    await Inventory.create([
      {
        variantId: createdVariant._id,
        sku,
        totalStock: variantData.quantity,
        reservedStock: 0,
        lowStockThreshold: 5
      }
    ], { session });

    if (variantData.quantity > 0) {
      await InventoryMovement.create([
        {
          sku,
          variantId: createdVariant._id,
          type: 'inbound',
          quantity: variantData.quantity,
          reference,
          createdBy: actorId
        }
      ], { session });
    }
  }

  return { createdCount: normalizedVariants.length };
};

const createFullProduct = async ({ payload, actorId }) => {
  await connectDB();

  const productInput = payload?.product || {};
  const variants = payload?.variants || [];

  const name = productInput?.name?.trim();
  const description = productInput?.description?.trim();
  const brand = productInput?.brand?.trim();
  const collectionName = productInput?.collectionName?.trim();
  const sportCategory = productInput?.sportCategory ? productInput.sportCategory.trim().toLowerCase() : null;
  const category = productInput?.category?.trim();
  const genderCategory = productInput?.genderCategory || 'Unisex';
  const status = productInput?.status || 'draft';
  const tags = Array.isArray(productInput?.tags) ? productInput.tags.filter(isNonEmptyString) : [];
  const metaTitle = productInput?.metaTitle?.trim() || '';
  const metaDescription = productInput?.metaDescription?.trim() || '';
  const relatedProducts = Array.isArray(productInput?.relatedProducts) ? productInput.relatedProducts : [];
  const discountStartDate = productInput?.discountStartDate || null;
  const discountEndDate = productInput?.discountEndDate || null;

  const missing = requireFields({ name, description, brand, collectionName, category }, ['name', 'description', 'brand', 'collectionName', 'category']);
  if (missing.length) {
    throw buildError({ message: 'Missing required product fields', status: 400, code: 'MISSING_FIELDS', details: missing });
  }

  if (collectionName === 'sports') {
    if (!sportCategory) {
      throw buildError({ message: 'Sport type is required for sports products', status: 400, code: 'SPORT_CATEGORY_REQUIRED' });
    }
    if (!SPORT_CATEGORIES.includes(sportCategory)) {
      throw buildError({ message: 'Invalid sport type', status: 400, code: 'INVALID_SPORT_CATEGORY' });
    }
  }

  if (!STATUS_VALUES.includes(status)) {
    throw buildError({ message: 'Invalid status value', status: 400, code: 'INVALID_STATUS' });
  }

  const slug = productInput?.slug ? slugify(productInput.slug) : slugify(name);
  const primaryVariant = variants[0] || {};

  const session = await mongoose.startSession();
  let createdProduct = null;
  let createdCount = 0;

  try {
    await session.withTransaction(async () => {
      const existing = await ProductV2.findOne({ slug }).session(session).lean();
      if (existing) {
        throw buildError({ message: 'Slug must be unique', status: 409, code: 'SLUG_EXISTS' });
      }

      const [product] = await ProductV2.create([
        {
          productCode: await generateProductCode({
            category,
            genderCategory,
            color: primaryVariant?.color || productInput?.color || productInput?.productCodeColor,
            size: primaryVariant?.size || productInput?.size || productInput?.productCodeSize,
            session
          }),
          name,
          slug,
          description,
          brand,
          collectionName,
          sportCategory: collectionName === 'sports' ? sportCategory : null,
          category,
          genderCategory,
          tags,
          status,
          metaTitle,
          metaDescription,
          relatedProducts,
          discountStartDate,
          discountEndDate,
          createdBy: actorId,
          activityLog: [
            {
              action: 'created',
              actorId,
              note: 'Product created'
            }
          ]
        }
      ], { session });

      createdProduct = product;
      const result = await createVariantsWithInventory({
        session,
        product,
        variants,
        actorId,
        reference: 'product_full_create'
      });
      createdCount = result.createdCount;
    });
  } finally {
    await session.endSession();
  }

  logger.info('products.v2.full_create', { productId: createdProduct?._id, createdCount, actorId });

  return { product: createdProduct, createdCount };
};

const createVariantsForProduct = async ({ productId, variants, actorId, reference = 'variant_bulk' }) => {
  await connectDB();

  const session = await mongoose.startSession();
  let createdCount = 0;

  try {
    await session.withTransaction(async () => {
      const product = await ProductV2.findById(productId).session(session);
      if (!product) {
        throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
      }

      const result = await createVariantsWithInventory({
        session,
        product,
        variants,
        actorId,
        reference
      });
      createdCount = result.createdCount;
    });
  } finally {
    await session.endSession();
  }

  logger.info('products.v2.variants_bulk', { productId, createdCount, actorId });

  return { createdCount };
};

export { createFullProduct, createVariantsForProduct };

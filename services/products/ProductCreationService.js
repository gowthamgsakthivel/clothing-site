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
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${categoryCode}-${brandCode}-${randomSuffix}`;
};

const buildSku = ({ productCode, color, size }) => {
  const colorCode = toCode(color, 3);
  const sizeCode = toCode(size, 2);
  return `SS-${productCode}-${colorCode}-${sizeCode}`;
};

const isValidImageUrl = (value) => typeof value === 'string' && value.trim().length > 0 && (
  /^https?:\/\//i.test(value.trim()) ||
  /^\//.test(value.trim()) ||
  /^data:image\//i.test(value.trim())
);

const normalizeVariants = (variants) => {
  if (!Array.isArray(variants) || !variants.length) {
    throw buildError({ message: 'Variants are required', status: 400, code: 'VARIANTS_REQUIRED' });
  }

  return variants.map((variant, index) => {
    const color = variant?.color?.trim() || 'Standard';
    let colorCode = variant?.colorCode ? variant.colorCode.trim() : null;
    if (!colorCode || !isValidColorCode(colorCode)) {
      colorCode = '#6366f1';
    }

    const size = variant?.size?.trim() || 'M';
    const originalPrice = toNumber(variant?.originalPrice, 1499);
    const offerPrice = toNumber(variant?.offerPrice ?? variant?.originalPrice, 999);
    let images = Array.isArray(variant?.images) ? variant.images.filter(isNonEmptyString) : [];
    images = images.filter(isValidImageUrl);

    const quantity = Math.max(0, toNumber(variant?.quantity, 0));

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
    let sku = buildSku({
      productCode,
      color: variantData.color,
      size: variantData.size
    });

    // Handle SKU collision gracefully
    const existingSkuQuery = ProductVariant.findOne({ sku });
    if (session) existingSkuQuery.session(session);
    const existingSku = await existingSkuQuery.lean();

    if (existingSku) {
      sku = `${sku}-${Math.floor(Math.random() * 899 + 100)}`;
    }

    const existingVariantQuery = ProductVariant.findOne({
      productId: product._id,
      color: variantData.color,
      size: variantData.size
    });
    if (session) existingVariantQuery.session(session);
    const existingVariant = await existingVariantQuery.lean();

    if (existingVariant) {
      throw buildError({ message: `Variant ${variantData.color} (${variantData.size}) already exists for this product`, status: 409, code: 'DUPLICATE_VARIANT' });
    }

    const variantPayload = {
      productId: product._id,
      color: variantData.color,
      colorCode: variantData.colorCode,
      size: variantData.size,
      sku,
      originalPrice: variantData.originalPrice,
      offerPrice: variantData.offerPrice,
      visibility: 'visible',
      images: variantData.images
    };

    const createdVariant = session
      ? (await ProductVariant.create([variantPayload], { session }))[0]
      : await ProductVariant.create(variantPayload);

    const inventoryPayload = {
      variantId: createdVariant._id,
      sku,
      totalStock: variantData.quantity,
      reservedStock: 0,
      lowStockThreshold: 5
    };

    if (session) {
      await Inventory.create([inventoryPayload], { session });
    } else {
      await Inventory.create(inventoryPayload);
    }

    if (variantData.quantity > 0) {
      const movementPayload = {
        sku,
        variantId: createdVariant._id,
        type: 'inbound',
        quantity: variantData.quantity,
        reference,
        createdBy: actorId
      };
      if (session) {
        await InventoryMovement.create([movementPayload], { session });
      } else {
        await InventoryMovement.create(movementPayload);
      }
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

  const normalizedVariants = normalizeVariants(variants);

  const productCode = productInput?.productCode || buildProductCode({ category, brand });
  const slug = `${slugify(name)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const createdBy = actorId || 'admin';

  let createdProduct = null;
  let createdCount = 0;

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const [prod] = await ProductV2.create([
          {
            name,
            slug,
            description,
            collectionName,
            sportCategory,
            category,
            genderCategory,
            brand,
            productCode,
            status,
            tags,
            metaTitle,
            metaDescription,
            relatedProducts,
            discountStartDate,
            discountEndDate,
            createdBy,
            activityLog: [
              {
                action: 'created',
                actorId: createdBy,
                note: 'Product created via Admin Portal'
              }
            ]
          }
        ], { session });

        createdProduct = prod;

        const result = await createVariantsWithInventory({
          session,
          product: createdProduct,
          variants: normalizedVariants,
          actorId,
          reference: 'product_create'
        });

        createdCount = result.createdCount;
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    // Fallback if Mongo transactions are not supported (e.g. standalone server)
    if (error?.message?.includes('Transaction') || error?.message?.includes('replica set') || error?.code === 20) {
      createdProduct = await ProductV2.create({
        name,
        slug,
        description,
        collectionName,
        sportCategory,
        category,
        genderCategory,
        brand,
        productCode,
        status,
        tags,
        metaTitle,
        metaDescription,
        relatedProducts,
        discountStartDate,
        discountEndDate,
        createdBy,
        activityLog: [
          {
            action: 'created',
            actorId: createdBy,
            note: 'Product created via Admin Portal'
          }
        ]
      });

      const result = await createVariantsWithInventory({
        session: null,
        product: createdProduct,
        variants: normalizedVariants,
        actorId,
        reference: 'product_create'
      });
      createdCount = result.createdCount;
    } else {
      throw error;
    }
  }

  logger.info('products.v2.full_create', { productId: createdProduct._id, createdCount, actorId });

  return { product: createdProduct, createdCount };
};

const createVariantsForProduct = async ({ productId, variants, actorId, reference = 'variant_bulk' }) => {
  await connectDB();

  let createdCount = 0;

  try {
    const session = await mongoose.startSession();
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
  } catch (error) {
    // Fallback if Mongo transactions are not supported (e.g. standalone server)
    if (error?.message?.includes('Transaction') || error?.message?.includes('replica set') || error?.code === 20) {
      const product = await ProductV2.findById(productId);
      if (!product) {
        throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
      }

      const result = await createVariantsWithInventory({
        session: null,
        product,
        variants,
        actorId,
        reference
      });
      createdCount = result.createdCount;
    } else {
      throw error;
    }
  }

  logger.info('products.v2.variants_bulk', { productId, createdCount, actorId });

  return { createdCount };
};

export { createFullProduct, createVariantsForProduct };

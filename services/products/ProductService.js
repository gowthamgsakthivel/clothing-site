import mongoose from 'mongoose';
import connectDB from '@/config/db';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import InventoryMovement from '@/models/v2/InventoryMovement';
import logger from '@/lib/logger';
import { buildError } from '@/lib/errors';
import { requireFields, isNonEmptyString } from '@/lib/validation';
import { generateProductCode } from '@/lib/codeGenerators';

const STATUS_VALUES = ['draft', 'active', 'hidden', 'archived'];
const SPORT_CATEGORIES = ['cricket', 'football', 'basketball', 'badminton', 'tennis', 'gym'];

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

const ensureUniqueSlug = async (slug, excludeId = null) => {
  const query = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await ProductV2.findOne(query).lean();
  return !existing;
};

const createProduct = async ({ payload, createdBy }) => {
  await connectDB();

  const name = payload?.name?.trim();
  const description = payload?.description?.trim() || '';
  const brand = payload?.brand?.trim();
  const collectionName = payload?.collectionName?.trim();
  const sportCategory = payload?.sportCategory ? payload.sportCategory.trim().toLowerCase() : null;
  const category = payload?.category?.trim();
  const genderCategory = payload?.genderCategory || 'Unisex';
  const status = payload?.status || 'draft';
  const tags = Array.isArray(payload?.tags) ? payload.tags.filter(isNonEmptyString) : [];
  const metaTitle = payload?.metaTitle?.trim() || '';
  const metaDescription = payload?.metaDescription?.trim() || '';
  const relatedProducts = Array.isArray(payload?.relatedProducts) ? payload.relatedProducts : [];
  const discountStartDate = payload?.discountStartDate || null;
  const discountEndDate = payload?.discountEndDate || null;

  const missing = requireFields({ name, brand, collectionName, category }, ['name', 'brand', 'collectionName', 'category']);
  if (missing.length) {
    throw buildError({ message: 'Missing required fields', status: 400, code: 'MISSING_FIELDS', details: missing });
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

  const slug = payload?.slug ? slugify(payload.slug) : slugify(name);
  const productCode = await generateProductCode({
    category,
    genderCategory,
    color: payload?.color || payload?.productCodeColor || payload?.primaryColor || payload?.variants?.[0]?.color,
    size: payload?.size || payload?.productCodeSize || payload?.primarySize || payload?.variants?.[0]?.size
  });
  const isUnique = await ensureUniqueSlug(slug);
  if (!isUnique) {
    throw buildError({ message: 'Slug must be unique', status: 409, code: 'SLUG_EXISTS' });
  }

  const product = await ProductV2.create({
    productCode,
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
    createdBy,
    activityLog: [
      {
        action: 'created',
        actorId: createdBy,
        note: 'Product created'
      }
    ]
  });

  logger.info('products.v2.create', { productId: product._id, createdBy });

  return { product };
};

const updateProduct = async ({ productId, payload, actorId }) => {
  await connectDB();

  const product = await ProductV2.findById(productId);
  if (!product) {
    throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
  }

  if (payload?.status && !STATUS_VALUES.includes(payload.status)) {
    throw buildError({ message: 'Invalid status value', status: 400, code: 'INVALID_STATUS' });
  }

  if (payload?.slug) {
    const slug = slugify(payload.slug);
    const isUnique = await ensureUniqueSlug(slug, productId);
    if (!isUnique) {
      throw buildError({ message: 'Slug must be unique', status: 409, code: 'SLUG_EXISTS' });
    }
    product.slug = slug;
  }

  if (payload?.name) product.name = payload.name.trim();
  if (payload?.description !== undefined) product.description = payload.description.trim();
  if (payload?.brand) product.brand = payload.brand.trim();
  if (payload?.collectionName) {
    product.collectionName = payload.collectionName.trim();
    if (product.collectionName !== 'sports') {
      product.sportCategory = null;
    }
  }
  if (payload?.sportCategory !== undefined) {
    const nextSportCategory = payload.sportCategory ? payload.sportCategory.trim().toLowerCase() : null;
    if (product.collectionName === 'sports') {
      if (!nextSportCategory) {
        throw buildError({ message: 'Sport type is required for sports products', status: 400, code: 'SPORT_CATEGORY_REQUIRED' });
      }
      if (!SPORT_CATEGORIES.includes(nextSportCategory)) {
        throw buildError({ message: 'Invalid sport type', status: 400, code: 'INVALID_SPORT_CATEGORY' });
      }
    }
    product.sportCategory = product.collectionName === 'sports' ? nextSportCategory : null;
  }
  if (payload?.category) product.category = payload.category.trim();
  if (payload?.genderCategory) product.genderCategory = payload.genderCategory;
  if (payload?.status) product.status = payload.status;
  if (payload?.metaTitle !== undefined) product.metaTitle = payload.metaTitle.trim();
  if (payload?.metaDescription !== undefined) product.metaDescription = payload.metaDescription.trim();
  if (Array.isArray(payload?.tags)) product.tags = payload.tags.filter(isNonEmptyString);
  if (Array.isArray(payload?.relatedProducts)) product.relatedProducts = payload.relatedProducts;
  if (payload?.discountStartDate !== undefined) product.discountStartDate = payload.discountStartDate || null;
  if (payload?.discountEndDate !== undefined) product.discountEndDate = payload.discountEndDate || null;

  product.activityLog.push({
    action: 'updated',
    actorId,
    note: 'Product updated'
  });

  await product.save();
  logger.info('products.v2.update', { productId, actorId });

  return { product };
};

const archiveProduct = async ({ productId, actorId }) => {
  await connectDB();

  const product = await ProductV2.findById(productId);
  if (!product) {
    throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
  }

  product.status = 'archived';
  product.activityLog.push({
    action: 'archived',
    actorId,
    note: 'Product archived'
  });

  await product.save();
  logger.info('products.v2.archive', { productId, actorId });

  return { product };
};

const restoreProduct = async ({ productId, actorId }) => {
  await connectDB();

  const product = await ProductV2.findById(productId);
  if (!product) {
    throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
  }

  product.status = 'active';
  product.activityLog.push({
    action: 'restored',
    actorId,
    note: 'Product restored'
  });

  await product.save();
  logger.info('products.v2.restore', { productId, actorId });

  return { product };
};

const deleteProduct = async ({ productId, actorId }) => {
  await connectDB();

  const product = await ProductV2.findById(productId).lean();
  if (!product) {
    throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const variants = await ProductVariant.find({ productId }, '_id').session(session).lean();
      const variantIds = variants.map((variant) => variant._id);

      if (variantIds.length) {
        await InventoryMovement.deleteMany({ variantId: { $in: variantIds } }).session(session);
        await Inventory.deleteMany({ variantId: { $in: variantIds } }).session(session);
        await ProductVariant.deleteMany({ _id: { $in: variantIds } }).session(session);
      }

      await ProductV2.deleteOne({ _id: productId }).session(session);
    });
  } finally {
    await session.endSession();
  }

  logger.info('products.v2.delete', { productId, actorId });

  return { productId };
};

const getProductsWithPagination = async ({
  page = 1,
  limit = 20,
  status,
  collectionName,
  category,
  search,
  sort = 'createdAt',
  order = 'desc',
  includeVariants = false
} = {}) => {
  await connectDB();

  const filters = {};
  if (status) filters.status = status;
  if (collectionName) filters.collectionName = collectionName;
  if (category) filters.category = category;
  if (search) {
    filters.name = { $regex: search, $options: 'i' };
  }

  const safeOrder = order === 'asc' ? 1 : -1;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    includeVariants
      ? ProductV2.aggregate([
          { $match: filters },
          { $sort: { [sort]: safeOrder } },
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $lookup: {
              from: 'product_variants_v2',
              localField: '_id',
              foreignField: 'productId',
              as: 'variants'
            }
          }
        ])
      : ProductV2.find(filters)
          .sort({ [sort]: safeOrder })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
    ProductV2.countDocuments(filters)
  ]);


  return {
    products,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      total
    }
  };
};

const getProductById = async ({ productId }) => {
  await connectDB();

  const product = await ProductV2.findById(productId).lean();
  if (!product) {
    throw buildError({ message: 'Product not found', status: 404, code: 'PRODUCT_NOT_FOUND' });
  }

  const variants = await ProductVariant.find({ productId }).lean();

  return { product, variants };
};

export {
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  deleteProduct,
  getProductsWithPagination,
  getProductById
};

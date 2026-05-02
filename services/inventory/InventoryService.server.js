import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Inventory from '@/models/v2/Inventory';
import InventoryMovement from '@/models/v2/InventoryMovement';
import ProductVariant from '@/models/v2/ProductVariant';
import ProductV2 from '@/models/v2/Product';
import logger from '@/lib/logger';
import { buildError } from '@/lib/errors';
import { toNumber } from '@/lib/validation';

const createMovement = async ({ sku, variantId, type, quantity, reference = null, createdBy = null }, session) => {
  const movement = {
    sku,
    variantId,
    type,
    quantity,
    reference,
    createdBy
  };

  return InventoryMovement.create([movement], { session });
};

const createInventoryForVariant = async (variantId, initialStock = 0, options = {}) => {
  await connectDB();
  const session = options?.session;

  const stockValue = Math.max(0, toNumber(initialStock, 0));

  const inventory = await Inventory.findOne({ variantId }).lean();
  if (inventory) {
    throw buildError({ message: 'Inventory already exists for variant', status: 409, code: 'INVENTORY_EXISTS' });
  }

  const created = await Inventory.create([
    {
      variantId,
      sku: '',
      totalStock: stockValue,
      reservedStock: 0,
      lowStockThreshold: 5
    }
  ], { session });

  logger.info('inventory.v2.create', { variantId });

  const createdDoc = created?.[0];
  if (stockValue > 0 && createdDoc) {
    await createMovement({ sku: createdDoc.sku, variantId, type: 'inbound', quantity: stockValue }, session);
  }

  return { inventory: createdDoc };
};

const updateStock = async (sku, quantityChange, reference = null, actorId = null, options = {}) => {
  await connectDB();
  const session = options?.session;

  const change = toNumber(quantityChange, 0);
  if (!Number.isFinite(change) || change === 0) {
    throw buildError({ message: 'Quantity change must be a non-zero number', status: 400, code: 'INVALID_QUANTITY' });
  }

  const decrement = Math.abs(change);
  const filter = change < 0
    ? {
        sku,
        $expr: {
          $gte: [
            { $subtract: ['$totalStock', '$reservedStock'] },
            decrement
          ]
        }
      }
    : { sku };

  const inventory = await Inventory.findOneAndUpdate(
    filter,
    { $inc: { totalStock: change } },
    { new: true, session }
  );

  if (!inventory) {
    throw buildError({ message: 'Insufficient stock or inventory not found', status: 409, code: 'INSUFFICIENT_STOCK' });
  }

  await createMovement({
    sku: inventory.sku,
    variantId: inventory.variantId,
    type: change > 0 ? 'inbound' : 'outbound',
    quantity: Math.abs(change),
    reference,
    createdBy: actorId
  }, session);

  return { inventory };
};

const reserveStock = async (sku, quantity, reference = null, actorId = null, options = {}) => {
  await connectDB();
  const session = options?.session;

  const qty = toNumber(quantity, 0);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw buildError({ message: 'Quantity must be greater than zero', status: 400, code: 'INVALID_QUANTITY' });
  }

  const inventory = await Inventory.findOneAndUpdate(
    {
      sku,
      $expr: {
        $gte: [
          { $subtract: ['$totalStock', '$reservedStock'] },
          qty
        ]
      }
    },
    { $inc: { reservedStock: qty } },
    { new: true, session }
  );

  if (!inventory) {
    throw buildError({ message: 'Insufficient stock to reserve', status: 409, code: 'INSUFFICIENT_STOCK' });
  }

  await createMovement({
    sku: inventory.sku,
    variantId: inventory.variantId,
    type: 'reserve',
    quantity: qty,
    reference,
    createdBy: actorId
  }, session);

  return { inventory };
};

const releaseReservedStock = async (sku, quantity, reference = null, actorId = null, options = {}) => {
  await connectDB();
  const session = options?.session;

  const qty = toNumber(quantity, 0);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw buildError({ message: 'Quantity must be greater than zero', status: 400, code: 'INVALID_QUANTITY' });
  }

  const inventory = await Inventory.findOneAndUpdate(
    { sku, reservedStock: { $gte: qty } },
    { $inc: { reservedStock: -qty } },
    { new: true, session }
  );

  if (!inventory) {
    throw buildError({ message: 'Insufficient reserved stock to release', status: 409, code: 'INSUFFICIENT_RESERVED' });
  }

  await createMovement({
    sku: inventory.sku,
    variantId: inventory.variantId,
    type: 'release',
    quantity: qty,
    reference,
    createdBy: actorId
  }, session);

  return { inventory };
};

const deductStockAfterShipment = async (sku, quantity, reference = null, actorId = null, options = {}) => {
  await connectDB();
  const session = options?.session;

  const qty = toNumber(quantity, 0);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw buildError({ message: 'Quantity must be greater than zero', status: 400, code: 'INVALID_QUANTITY' });
  }

  const inventory = await Inventory.findOneAndUpdate(
    {
      sku,
      totalStock: { $gte: qty },
      reservedStock: { $gte: qty }
    },
    { $inc: { totalStock: -qty, reservedStock: -qty } },
    { new: true, session }
  );

  if (!inventory) {
    throw buildError({ message: 'Insufficient stock to deduct', status: 409, code: 'INSUFFICIENT_STOCK' });
  }

  await createMovement({
    sku: inventory.sku,
    variantId: inventory.variantId,
    type: 'outbound',
    quantity: qty,
    reference,
    createdBy: actorId
  }, session);

  return { inventory };
};

const getInventoryBySku = async (sku) => {
  await connectDB();

  const inventory = await Inventory.findOne({ sku }).lean();
  if (!inventory) {
    throw buildError({ message: 'Inventory not found', status: 404, code: 'INVENTORY_NOT_FOUND' });
  }

  return { inventory };
};

const listInventory = async ({
  page = 1,
  limit = 20,
  lowStockOnly = false,
  sku,
  productId,
  productSearch
} = {}) => {
  await connectDB();

  const filter = {};
  if (sku) {
    filter.sku = { $regex: sku.toString().trim(), $options: 'i' };
  }

  if (lowStockOnly) {
    filter.$expr = {
      $lte: [
        { $subtract: ['$totalStock', '$reservedStock'] },
        '$lowStockThreshold'
      ]
    };
  }

  if (productId) {
    const variants = await ProductVariant.find({
      productId,
      visibility: { $ne: 'hidden' }
    }, '_id').lean();

    const variantIds = variants.map((variant) => variant._id);
    if (!variantIds.length) {
      return {
        inventory: [],
        pagination: { currentPage: Number(page), totalPages: 1, total: 0 },
        summary: { totalSkus: 0, lowStockSkus: 0, totalReservedUnits: 0, totalAvailableUnits: 0 }
      };
    }

    filter.variantId = { $in: variantIds };
  }

  if (productSearch) {
    const term = productSearch.toString().trim();
    const products = await ProductV2.find({ name: { $regex: term, $options: 'i' } }, '_id').lean();
    const productIds = products.map((product) => product._id);
    if (!productIds.length) {
      return {
        inventory: [],
        pagination: { currentPage: Number(page), totalPages: 1, total: 0 },
        summary: { totalSkus: 0, lowStockSkus: 0, totalReservedUnits: 0, totalAvailableUnits: 0 }
      };
    }
    const variants = await ProductVariant.find({
      productId: { $in: productIds },
      visibility: { $ne: 'hidden' }
    }, '_id').lean();
    const variantIds = variants.map((variant) => variant._id);
    if (!variantIds.length) {
      return {
        inventory: [],
        pagination: { currentPage: Number(page), totalPages: 1, total: 0 },
        summary: { totalSkus: 0, lowStockSkus: 0, totalReservedUnits: 0, totalAvailableUnits: 0 }
      };
    }
    filter.variantId = { $in: variantIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    Inventory.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: 'variantId',
        // include pricing fields so UI can show original/offer prices
        select: 'color colorCode size productId originalPrice offerPrice sku',
        populate: { path: 'productId', select: 'name' }
      })
      .lean(),
    Inventory.countDocuments(filter)
  ]);

  const summaryMatch = filter;
  const summaryAggregation = await Inventory.aggregate([
    { $match: summaryMatch },
    {
      $group: {
        _id: null,
        totalSkus: { $sum: 1 },
        totalReservedUnits: { $sum: '$reservedStock' },
        totalAvailableUnits: { $sum: { $subtract: ['$totalStock', '$reservedStock'] } },
        lowStockSkus: {
          $sum: {
            $cond: [
              { $lte: [{ $subtract: ['$totalStock', '$reservedStock'] }, '$lowStockThreshold'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const summary = summaryAggregation?.[0] || {
    totalSkus: 0,
    lowStockSkus: 0,
    totalReservedUnits: 0,
    totalAvailableUnits: 0
  };

  const inventory = records.map((record) => {
    const variant = record.variantId || {};
    const product = variant.productId || {};
    const availableStock = Math.max(0, record.totalStock - record.reservedStock);

    return {
      ...record,
      productName: product.name || 'Unknown',
      color: variant.color || '--',
      colorCode: variant.colorCode || null,
      size: variant.size || '--',
      originalPrice: variant.originalPrice != null ? variant.originalPrice : null,
      offerPrice: variant.offerPrice != null ? variant.offerPrice : variant.originalPrice != null ? variant.originalPrice : null,
      availableStock
    };
  });

  return {
    inventory,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      total
    },
    summary
  };
};

const bulkUpdateStock = async ({ updates, actorId = null, reference = 'admin_bulk' }) => {
  await connectDB();

  if (!Array.isArray(updates) || !updates.length) {
    throw buildError({ message: 'Updates are required', status: 400, code: 'UPDATES_REQUIRED' });
  }

  const session = await mongoose.startSession();
  const results = [];

  try {
    await session.withTransaction(async () => {
      for (const update of updates) {
        const sku = update?.sku;
        const quantityChange = update?.quantityChange;
        if (!sku || !Number.isFinite(toNumber(quantityChange, NaN))) {
          throw buildError({ message: 'Invalid update payload', status: 400, code: 'INVALID_UPDATE' });
        }

        const result = await updateStock(sku, quantityChange, reference, actorId, { session });
        results.push({ sku, inventory: result.inventory });
      }
    });
  } finally {
    await session.endSession();
  }

  return { results };
};

export {
  createInventoryForVariant,
  updateStock,
  reserveStock,
  releaseReservedStock,
  deductStockAfterShipment,
  getInventoryBySku,
  listInventory,
  bulkUpdateStock
};

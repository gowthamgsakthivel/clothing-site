// This script requires MONGODB_URI in .env.local
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../../config/db.js';
import LegacyProduct from '../../models/Product.js';
import ProductV2 from '../../models/v2/Product.js';
import ProductVariant from '../../models/v2/ProductVariant.js';
import Inventory from '../../models/v2/Inventory.js';
import InventoryMovement from '../../models/v2/InventoryMovement.js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined. Add it to .env.local');
}

const CONFIRM_MIGRATION = process.env.CONFIRM_MIGRATION === 'true';
const DRY_RUN = !CONFIRM_MIGRATION || process.env.DRY_RUN === '1';
const LIMIT = Number.parseInt(process.env.MIGRATE_LIMIT || '0', 10);
const SKIP = Number.parseInt(process.env.MIGRATE_SKIP || '0', 10);

const assertV2Collections = () => {
  const collectionNames = [
    ProductV2.collection?.name,
    ProductVariant.collection?.name,
    Inventory.collection?.name,
    InventoryMovement.collection?.name
  ];

  const invalid = collectionNames.filter((name) => !name || !name.endsWith('_v2'));
  if (invalid.length) {
    throw new Error(`Migration aborted: non-v2 collections detected (${invalid.join(', ')})`);
  }
};

const assertTransactionsAvailable = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    await admin.command({ replSetGetStatus: 1 });
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('MongoDB transactions require replica set. Enable replica set before running migration.');
    process.exit(1);
  }
};

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

const ensureUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 2;
  while (await ProductV2.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return slug;
};

const buildFallbackInventory = (product) => {
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['ONE'];
  const colorName = product.color?.[0]?.color || 'Default';
  const total = Number.isFinite(product.totalStock) ? product.totalStock : product.stock || 0;
  return [
    {
      color: { name: colorName, code: '#000000' },
      sizeStock: sizes.map((size, index) => ({
        size,
        quantity: index === 0 ? total : 0,
        lowStockThreshold: product.stockSettings?.globalLowStockThreshold ?? 10
      }))
    }
  ];
};

const buildVariantsFromProduct = (product, productCode) => {
  const inventorySource = Array.isArray(product.inventory) && product.inventory.length
    ? product.inventory
    : buildFallbackInventory(product);

  const variants = [];
  const inventories = [];
  const skuSet = new Set();

  inventorySource.forEach((colorEntry) => {
    const colorName = colorEntry?.color?.name || 'Default';
    const colorCode = toCode(colorName, 3);
    const sizeStock = Array.isArray(colorEntry?.sizeStock) && colorEntry.sizeStock.length
      ? colorEntry.sizeStock
      : [{ size: 'ONE', quantity: 0, lowStockThreshold: product.stockSettings?.globalLowStockThreshold ?? 10 }];

    sizeStock.forEach((sizeEntry) => {
      const sizeName = sizeEntry?.size || 'ONE';
      const sizeCode = toCode(sizeName, 2);
      const sku = `SS-${productCode}-${colorCode}-${sizeCode}`;

      if (skuSet.has(sku)) {
        return;
      }
      skuSet.add(sku);

      const quantity = Math.max(0, Number.parseInt(sizeEntry?.quantity || 0, 10));
      const lowStockThreshold = Math.max(0, Number.parseInt(sizeEntry?.lowStockThreshold || 0, 10))
        || product.stockSettings?.globalLowStockThreshold
        || 10;

      variants.push({
        color: colorName,
        size: sizeName,
        sku,
        originalPrice: product.price,
        offerPrice: product.offerPrice,
        visibility: 'visible',
        images: Array.isArray(product.image) ? product.image : []
      });

      inventories.push({
        sku,
        totalStock: quantity,
        reservedStock: 0,
        lowStockThreshold
      });

    });
  });

  return { variants, inventories };
};

const countMovementsForInventories = (inventories) => {
  if (!Array.isArray(inventories)) return 0;
  return inventories.filter((entry) => (entry?.totalStock || 0) > 0).length;
};

const migrate = async () => {
  await connectDB();
  await assertTransactionsAvailable();
  assertV2Collections();

  if (DRY_RUN) {
    console.log('Migration running in DRY_RUN mode. Set CONFIRM_MIGRATION=true to write data.');
  }

  const query = LegacyProduct.find().sort({ date: 1 });
  if (SKIP) query.skip(SKIP);
  if (LIMIT) query.limit(LIMIT);

  const legacyCount = await LegacyProduct.countDocuments();
  const legacyProducts = await query.lean();
  const summary = {
    processed: 0,
    migrated: 0,
    variantsCreated: 0,
    inventoryCreated: 0,
    movementsCreated: 0,
    skipped: 0,
    errors: []
  };

  for (let index = 0; index < legacyProducts.length; index += 1) {
    const legacy = legacyProducts[index];
    summary.processed += 1;

    if (!legacy?.name || !legacy?.description || !legacy?.brand || !legacy?.category) {
      summary.skipped += 1;
      summary.errors.push({ id: legacy?._id?.toString() || 'unknown', reason: 'missing required fields' });
      continue;
    }

    const alreadyMigrated = await ProductV2.findOne({ legacyProductId: legacy._id }).lean();
    if (alreadyMigrated) {
      summary.skipped += 1;
      summary.errors.push({ id: legacy._id.toString(), reason: 'already migrated' });
      continue;
    }

    const baseSlug = slugify(legacy.name);
    const slug = await ensureUniqueSlug(baseSlug);
    const productCode = `${toCode(slug, 3)}-${String(index + 1).padStart(4, '0')}`;

    const createdAt = legacy.date ? new Date(legacy.date) : new Date();
    const { variants, inventories } = buildVariantsFromProduct(legacy, productCode);
    const movementCount = countMovementsForInventories(inventories);

    if (!variants.length) {
      summary.skipped += 1;
      summary.errors.push({ id: legacy._id.toString(), reason: 'no variants generated' });
      continue;
    }

    if (DRY_RUN) {
      summary.migrated += 1;
      summary.variantsCreated += variants.length;
      summary.inventoryCreated += inventories.length;
      summary.movementsCreated += movementCount;
      continue;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const product = await ProductV2.create([
          {
            legacyProductId: legacy._id,
            name: legacy.name,
            slug,
            description: legacy.description,
            brand: legacy.brand,
            category: legacy.category,
            genderCategory: legacy.genderCategory || 'Unisex',
            tags: [],
            status: 'active',
            metaTitle: '',
            metaDescription: '',
            relatedProducts: [],
            discountStartDate: null,
            discountEndDate: null,
            createdBy: legacy.userId,
            activityLog: [
              {
                action: 'migrated',
                actorId: legacy.userId,
                note: `Migrated from legacy product ${legacy._id}`,
                createdAt
              }
            ],
            createdAt,
            updatedAt: createdAt
          }
        ], { session });

        const variantDocs = variants.map((variant) => ({
          ...variant,
          productId: product[0]._id,
          createdAt,
          updatedAt: createdAt
        }));

        const createdVariants = await ProductVariant.insertMany(variantDocs, { session });

        const inventoryDocs = createdVariants.map((variantDoc, idx) => ({
          variantId: variantDoc._id,
          sku: variantDoc.sku,
          totalStock: inventories[idx]?.totalStock || 0,
          reservedStock: inventories[idx]?.reservedStock || 0,
          lowStockThreshold: inventories[idx]?.lowStockThreshold || 10,
          updatedAt: createdAt
        }));

        await Inventory.insertMany(inventoryDocs, { session });

        const movementDocs = createdVariants.map((variantDoc, idx) => {
          const inventoryEntry = inventories[idx];
          if (!inventoryEntry || (inventoryEntry.totalStock || 0) <= 0) return null;
          return {
            sku: variantDoc.sku,
            variantId: variantDoc._id,
            type: 'inbound',
            quantity: inventoryEntry.totalStock,
            reference: `migration:${legacy._id}`,
            createdBy: legacy.userId,
            createdAt
          };
        }).filter(Boolean);

        if (movementDocs.length) {
          await InventoryMovement.insertMany(movementDocs, { session });
        }
      });
      summary.migrated += 1;
      summary.variantsCreated += variants.length;
      summary.inventoryCreated += inventories.length;
      summary.movementsCreated += movementCount;
    } catch (error) {
      summary.errors.push({ id: legacy._id.toString(), reason: error.message });
      summary.skipped += 1;
    } finally {
      await session.endSession();
    }
  }

  const migratedCount = await ProductV2.countDocuments();
  const variantsCount = await ProductVariant.countDocuments();
  const inventoryCount = await Inventory.countDocuments();
  const movementCount = await InventoryMovement.countDocuments();

  if (legacyCount !== migratedCount) {
    console.warn(`WARNING: Legacy products (${legacyCount}) != migrated products (${migratedCount}).`);
  }

  return {
    ...summary,
    legacyCount,
    migratedCount,
    variantsCount,
    inventoryCount,
    movementCount
  };
};

migrate()
  .then((summary) => {
    console.log('Migration summary:', summary);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

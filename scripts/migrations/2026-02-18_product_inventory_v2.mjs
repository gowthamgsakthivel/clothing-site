// This script requires MONGODB_URI in .env.local
// Purpose: backfill missing inventory documents for v2 variants.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../../config/db.js';
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

const DEFAULT_LOW_STOCK = Number.parseInt(process.env.DEFAULT_LOW_STOCK || '5', 10);

const migrate = async () => {
  await connectDB();
  await assertTransactionsAvailable();
  assertV2Collections();

  if (DRY_RUN) {
    console.log('Migration running in DRY_RUN mode. Set CONFIRM_MIGRATION=true to write data.');
  }

  const query = ProductVariant.find().sort({ createdAt: 1 });
  if (SKIP) query.skip(SKIP);
  if (LIMIT) query.limit(LIMIT);

  const variantCount = await ProductVariant.countDocuments();
  const variants = await query.lean();
  const summary = {
    processed: 0,
    inventoryCreated: 0,
    skipped: 0,
    errors: []
  };

  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index];
    summary.processed += 1;

    if (!variant?._id) {
      summary.skipped += 1;
      summary.errors.push({ id: 'unknown', reason: 'missing variant id' });
      continue;
    }

    const existingInventory = await Inventory.findOne({ variantId: variant._id }).lean();
    if (existingInventory) {
      summary.skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      summary.inventoryCreated += 1;
      continue;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Inventory.create([
          {
            variantId: variant._id,
            sku: variant.sku,
            totalStock: 0,
            reservedStock: 0,
            lowStockThreshold: DEFAULT_LOW_STOCK,
            updatedAt: new Date()
          }
        ], { session });
      });
      summary.inventoryCreated += 1;
    } catch (error) {
      summary.errors.push({ id: variant._id.toString(), reason: error.message });
      summary.skipped += 1;
    } finally {
      await session.endSession();
    }
  }

  const productCount = await ProductV2.countDocuments();
  const variantsCount = await ProductVariant.countDocuments();
  const inventoryCount = await Inventory.countDocuments();
  const movementCount = await InventoryMovement.countDocuments();

  return {
    ...summary,
    productCount,
    variantCount,
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

import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    totalStock: { type: Number, required: true, default: 0 },
    reservedStock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, required: true, default: 5 },
    warehouse: { type: String, default: null }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema, 'inventory_v2');

export default Inventory;

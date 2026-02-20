import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, index: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true, index: true },
    type: { type: String, enum: ['inbound', 'outbound', 'reserve', 'release'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    reference: { type: String, default: null },
    createdBy: { type: String, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryMovementSchema.index({ variantId: 1, createdAt: -1 });

const InventoryMovement = mongoose.models.InventoryMovement || mongoose.model('InventoryMovement', inventoryMovementSchema, 'inventory_movements_v2');

export default InventoryMovement;

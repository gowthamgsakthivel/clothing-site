import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductV2', required: true, index: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    sku: { type: String, required: true, unique: true, index: true },
    originalPrice: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    visibility: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
    images: { type: [String], default: [] }
  },
  { timestamps: true }
);

productVariantSchema.index({ productId: 1, color: 1, size: 1 }, { unique: true });

const ProductVariant = mongoose.models.ProductVariant || mongoose.model('ProductVariant', productVariantSchema, 'product_variants_v2');

export default ProductVariant;

import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actorId: { type: String, default: null },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    legacyProductId: { type: mongoose.Schema.Types.ObjectId, unique: true, sparse: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    genderCategory: {
      type: String,
      enum: ['Men', 'Women', 'Kids', 'Girls', 'Boys', 'Unisex'],
      default: 'Unisex'
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'active', 'hidden', 'archived'],
      default: 'draft'
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductV2' }],
    discountStartDate: { type: Date, default: null },
    discountEndDate: { type: Date, default: null },
    createdBy: { type: String, required: true },
    activityLog: { type: [activityLogSchema], default: [] }
  },
  { timestamps: true }
);

productSchema.index({ status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });

const ProductV2 = mongoose.models.ProductV2 || mongoose.model('ProductV2', productSchema, 'products_v2');

export default ProductV2;

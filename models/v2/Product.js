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
    productCode: { type: String, default: null },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    collectionName: {
      type: String,
      enum: ['products', 'sports', 'devotional', 'political'],
      required: true
    },
    sportCategory: {
      type: String,
      enum: ['cricket', 'football', 'basketball', 'badminton', 'tennis', 'gym'],
      default: null
    },
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
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    discountStartDate: { type: Date, default: null },
    discountEndDate: { type: Date, default: null },
    createdBy: { type: String, required: true },
    activityLog: { type: [activityLogSchema], default: [] }
  },
  { timestamps: true }
);

let ProductV2;

if (mongoose.models.ProductV2) {
  ProductV2 = mongoose.models.ProductV2;
} else {
  // Define indexes only once during initial model registration
  productSchema.index({ status: 1 });
  productSchema.index({ collectionName: 1 });
  productSchema.index({ sportCategory: 1 });
  productSchema.index({ category: 1 });
  productSchema.index({ brand: 1 });
  productSchema.index({ productCode: 1 }, { unique: true, sparse: true });

  ProductV2 = mongoose.model('ProductV2', productSchema, 'products_v2');
}

export default ProductV2;

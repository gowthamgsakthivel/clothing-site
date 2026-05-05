import mongoose from 'mongoose';

const featuredProductsSchema = new mongoose.Schema(
  {
    featuredProductIds: { type: [String], default: [] }
  },
  { timestamps: true }
);

const FeaturedProducts = mongoose.models.FeaturedProducts || mongoose.model('FeaturedProducts', featuredProductsSchema);

export default FeaturedProducts;
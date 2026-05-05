import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import FeaturedProducts from '@/models/FeaturedProducts';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import { requireAdmin } from '@/lib/authRoles';
import { buildInventoryByVariantId, getProductSummary } from '@/lib/v2ProductView';

async function loadFeaturedSettings() {
  let doc = await FeaturedProducts.findOne().lean();
  if (!doc) {
    doc = await FeaturedProducts.create({ featuredProductIds: [] });
    return doc.toObject();
  }

  return doc;
}

async function loadFeaturedProducts(featuredProductIds = []) {
  if (!featuredProductIds.length) return [];

  const productIds = featuredProductIds;
  const rawProducts = await ProductV2.find({ _id: { $in: productIds } }).lean();
  const variants = rawProducts.length
    ? await ProductVariant.find({ productId: { $in: rawProducts.map((product) => product._id) }, visibility: { $ne: 'hidden' } }).lean()
    : [];
  const inventories = variants.length
    ? await Inventory.find({ variantId: { $in: variants.map((variant) => variant._id) } }).lean()
    : [];

  const variantsByProduct = new Map();
  variants.forEach((variant) => {
    const key = String(variant.productId);
    if (!variantsByProduct.has(key)) {
      variantsByProduct.set(key, []);
    }
    variantsByProduct.get(key).push(variant);
  });

  const inventoryByVariantId = buildInventoryByVariantId(inventories);
  const bundlesById = new Map(rawProducts.map((product) => [String(product._id), product]));

  return productIds
    .map((id) => {
      const product = bundlesById.get(String(id));
      if (!product) return null;

      const bundle = {
        product,
        variants: variantsByProduct.get(String(product._id)) || [],
        inventoryByVariantId
      };

      const summary = getProductSummary(bundle);
      return {
        ...summary,
        image: summary.images?.[0] || ''
      };
    })
    .filter(Boolean);
}

export async function GET() {
  try {
    await connectDB();
    const settings = await loadFeaturedSettings();
    const featuredProducts = await loadFeaturedProducts(settings.featuredProductIds || []);

    return NextResponse.json({
      success: true,
      featuredProductIds: settings.featuredProductIds || [],
      featuredProducts
    });
  } catch (error) {
    console.error('Featured products GET error', error);
    return NextResponse.json({ success: false, message: 'Failed to load featured products' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await req.json();
    const featuredProductIds = Array.isArray(body?.featuredProductIds)
      ? [...new Set(body.featuredProductIds.map((id) => String(id)).filter(Boolean))]
      : [];

    const saved = await FeaturedProducts.findOneAndUpdate(
      {},
      { featuredProductIds },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const featuredProducts = await loadFeaturedProducts(saved.featuredProductIds || []);

    return NextResponse.json({
      success: true,
      featuredProductIds: saved.featuredProductIds || [],
      featuredProducts
    });
  } catch (error) {
    console.error('Featured products PUT error', error);
    const status = error.status || 500;
    return NextResponse.json({ success: false, message: error.message || 'Failed to save featured products' }, { status });
  }
}
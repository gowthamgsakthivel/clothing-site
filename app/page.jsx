import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import SeriesSpotlight from "@/components/SeriesSpotlight";
import ShopByCategory from "@/components/ShopByCategory";
import Footer from "@/components/Footer";
import SEOMetadata from "@/components/SEOMetadata";
import RecentlyViewed from "@/components/RecentlyViewed";
import connectDB from "@/config/db";
import CarouselControls from "@/models/CarouselControls";
import FeaturedProducts from "@/models/FeaturedProducts";
import ProductV2 from "@/models/v2/Product";
import ProductVariant from "@/models/v2/ProductVariant";
import Inventory from "@/models/v2/Inventory";
import { getDefaultCarouselControls } from "@/lib/carouselDefaults";
import { buildInventoryByVariantId, getProductSummary } from "@/lib/v2ProductView";

// Enable Incremental Static Regeneration (ISR) - revalidate every 60 seconds
export const revalidate = 60;

async function getHomeCarouselSlides() {
  try {
    await connectDB();
    const doc = await CarouselControls.findOne().lean();
    if (doc?.home && Array.isArray(doc.home) && doc.home.length > 0) {
      return JSON.parse(JSON.stringify(doc.home));
    }
    const defaults = getDefaultCarouselControls();
    return JSON.parse(JSON.stringify(defaults.home || []));
  } catch (e) {
    console.error("getHomeCarouselSlides error:", e);
    const defaults = getDefaultCarouselControls();
    return JSON.parse(JSON.stringify(defaults.home || []));
  }
}

async function getFeaturedProducts() {
  try {
    await connectDB();
    const settings = await FeaturedProducts.findOne().lean();
    const featuredProductIds = settings?.featuredProductIds || [];
    if (!featuredProductIds.length) return [];

    const rawProducts = await ProductV2.find({ _id: { $in: featuredProductIds } }).lean();
    const productIds = rawProducts.map((p) => p._id);

    const variants = productIds.length
      ? await ProductVariant.find({ productId: { $in: productIds }, visibility: { $ne: 'hidden' } }).lean()
      : [];

    const variantIds = variants.map((v) => v._id);
    const inventories = variantIds.length
      ? await Inventory.find({ variantId: { $in: variantIds } }).lean()
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

    const featured = featuredProductIds
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
          _id: String(summary._id || id),
          image: summary.images?.[0] || ''
        };
      })
      .filter(Boolean);

    return JSON.parse(JSON.stringify(featured));
  } catch (e) {
    console.error("getFeaturedProducts error:", e);
    return [];
  }
}

const Home = async () => {
  const [homeSlides, featuredProducts] = await Promise.all([
    getHomeCarouselSlides(),
    getFeaturedProducts()
  ]);

  return (
    <>
      <SEOMetadata
        title="Sparrow Sports | Premium Sports & Athletic Wear"
        description="Discover premium sports equipment, athletic wear, and accessories at Sparrow Sports. Shop the latest collections from top brands with fast delivery and easy returns."
        keywords="sports equipment, athletic wear, sportswear, sports gear, fitness equipment, athletic apparel, sports accessories, online sports store"
        url="/"
      />
      <div className="px-4 sm:px-6 md:px-16 lg:px-32">
        <HeaderSlider slides={homeSlides} />
        <HomeProducts />
        <ShopByCategory />
        <SeriesSpotlight products={featuredProducts} />
        <Banner />
        <RecentlyViewed />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;

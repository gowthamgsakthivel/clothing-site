import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import ProductV2 from "@/models/v2/Product";
import ProductVariant from "@/models/v2/ProductVariant";
import Inventory from "@/models/v2/Inventory";
import { mapV2ProductToLegacy } from "@/lib/v2ProductMapper";

export async function GET(request, { params }) {
  try {
    const { id } = params || {};
    if (!id) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
    }

    await connectDB();

    const product = await ProductV2.findById(id).lean();
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const variants = await ProductVariant.find({ productId: product._id }).lean();
    const variantIds = variants.map((variant) => variant._id);
    const inventories = variantIds.length
      ? await Inventory.find({ variantId: { $in: variantIds } }).lean()
      : [];

    const inventoryByVariantId = new Map();
    inventories.forEach((inventory) => {
      inventoryByVariantId.set(String(inventory.variantId), inventory);
    });

    const mapped = mapV2ProductToLegacy({
      product,
      variants,
      inventoryByVariantId
    });

    return NextResponse.json({ success: true, product: mapped });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import { buildError } from '@/lib/errors';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import CustomDesign from '@/models/CustomDesign';
import { createOrder } from '@/services/orders/OrderService';
import OrderV2 from '@/models/v2/Order';
import User from '@/models/User';

const findExistingOrderByPaymentId = async (paymentId, razorpayOrderId) => {
  if (!paymentId && !razorpayOrderId) return null;
  const conditions = [];
  if (paymentId) conditions.push({ 'paymentMetadata.razorpay_payment_id': paymentId });
  if (razorpayOrderId) conditions.push({ 'paymentMetadata.razorpay_order_id': razorpayOrderId });
  if (!conditions.length) return null;

  const existing = await OrderV2.findOne({ $or: conditions }).lean();
  return existing;
};

const parseCartKey = (productKey) => {
  let productId = productKey;
  let color = null;
  let size = null;

  if (typeof productId === 'string' && productId.includes('_')) {
    const split = productId.split('_');
    productId = split[0];
    if (split.length === 3) {
      color = split[1];
      size = split[2];
    } else if (split.length === 2) {
      if (split[1].startsWith('#') || split[1].length === 7) {
        color = split[1];
      } else {
        size = split[1];
      }
    }
  }

  return { productId, color, size };
};

export async function POST(request) {
  try {
    const auth = getAuth(request);
    const userId = auth.userId;

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required.'
      }, { status: 401 });
    }

    await connectDB();

    const payload = await request.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (!payload?.address || !items.length) {
      return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    // Idempotency check before processing items
    const providedPaymentId = payload?.paymentDetails?.paymentId || payload?.paymentDetails?.payment_id || payload?.razorpay_payment_id || null;
    const providedRazorpayOrderId = payload?.paymentDetails?.orderId || payload?.paymentDetails?.razorpay_order_id || payload?.razorpay_order_id || null;

    if (providedPaymentId || providedRazorpayOrderId) {
      const existing = await findExistingOrderByPaymentId(providedPaymentId, providedRazorpayOrderId);
      if (existing && existing._id) {
        await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } }).catch(() => {});
        return NextResponse.json({ success: true, data: { orderId: existing._id } }, { status: 200 });
      }
    }

    const mappedItems = [];
    const customDesignIds = [];

    for (const item of items) {
      const productKey = item?.product;
      if (!productKey) {
        return NextResponse.json({ success: false, message: 'Invalid cart item' }, { status: 400 });
      }

      if (productKey.startsWith('custom_')) {
        const designId = productKey.replace('custom_', '');
        const design = await CustomDesign.findById(designId).lean();

        if (!design) {
          return NextResponse.json({ success: false, message: 'Custom design not found' }, { status: 404 });
        }

        if (String(design.user) !== String(userId)) {
          return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        if (design.status !== 'approved' || !design.quote?.amount) {
          return NextResponse.json({
            success: false,
            message: 'Custom design is not approved yet.'
          }, { status: 400 });
        }

        const quantity = Number(design.quantity || item?.quantity || 1);
        const totalPrice = Number(design.quote.amount || 0);
        const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;

        mappedItems.push({
          sku: `custom_${design._id}`,
          quantity,
          unitPrice,
          totalPrice,
          isCustomDesign: true,
          customDesignId: design._id,
          designName: design.designName || design.description || 'Custom Design',
          customDesignImage: design.designImage || null,
          size: design.size || null,
          color: design.preferredColor || null
        });

        customDesignIds.push(design._id);
        continue;
      }

      const { productId, color, size } = parseCartKey(productKey);
      const product = await ProductV2.findById(productId).lean();
      if (!product) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }

      const variantQuery = { productId: product._id };
      if (color) variantQuery.color = color;
      if (size) variantQuery.size = size;

      let variant = await ProductVariant.findOne(variantQuery).lean();
      if (!variant) {
        variant = await ProductVariant.findOne({ productId: product._id }).lean();
      }

      if (!variant) {
        return NextResponse.json({ success: false, message: 'Variant not found' }, { status: 404 });
      }

      const quantity = Number(item?.quantity || 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json({ success: false, message: 'Invalid quantity' }, { status: 400 });
      }

      const unitPrice = Number(variant.offerPrice ?? variant.originalPrice ?? 0);
      const totalPrice = unitPrice * quantity;

      mappedItems.push({
        variantId: variant._id,
        sku: variant.sku,
        quantity,
        unitPrice,
        totalPrice
      });
    }

    const subtotal = mappedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const taxTotal = Math.round(subtotal - (subtotal / 1.05));
    const shippingTotal = 0;
    const grandTotal = subtotal; // Product price is GST inclusive

    const orderResult = await createOrder({
      userId,
      items: mappedItems,
      paymentMethod: payload?.paymentMethod || 'Razorpay',
      paymentStatus: payload?.paymentStatus || 'Paid',
      paymentDetails: payload?.paymentDetails || undefined,
      shippingAddressId: payload?.address,
      taxTotal,
      shippingTotal,
      discountTotal: 0,
      grandTotal
    });

    await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } }).catch(() => {});

    if (customDesignIds.length && orderResult?.order?._id) {
      await CustomDesign.updateMany(
        { _id: { $in: customDesignIds } },
        {
          $set: {
            status: 'completed',
            orderId: orderResult.order._id,
            updatedAt: new Date()
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: { orderId: orderResult?.order?._id || null }
    }, { status: 201 });
  } catch (error) {
    const normalized = buildError(error);
    return NextResponse.json({
      success: false,
      message: normalized.message
    }, { status: normalized.status || 500 });
  }
}

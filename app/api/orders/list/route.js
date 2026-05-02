import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Address from '@/models/Address';
import OrderV2 from '@/models/v2/Order';
import Shipment from '@/models/v2/Shipment';
import ProductVariant from '@/models/v2/ProductVariant';
import ProductV2 from '@/models/v2/Product';
import { requireUser } from '@/lib/authRoles';

const toSeconds = (dateValue) => {
  if (!dateValue) return Math.floor(Date.now() / 1000);
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return Math.floor(Date.now() / 1000);
  return Math.floor(date.getTime() / 1000);
};

const toTitleCase = (value) => {
  if (!value) return '';
  return value
    .toString()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatOrderStatus = (status) => {
  const normalized = (status || '').toString().toLowerCase().trim();
  const map = {
    placed: 'Processing',
    pending: 'Processing',
    packed: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    rto: 'RTO',
    failed: 'Failed',
    return_requested: 'Return Requested'
  };
  return map[normalized] || toTitleCase(normalized) || 'Processing';
};

const formatShipmentStatus = (status) => {
  const normalized = (status || '').toString().toLowerCase().trim();
  const map = {
    out_for_delivery: 'Out for Delivery',
    in_transit: 'In Transit',
    shipped: 'Shipped',
    delivered: 'Delivered',
    rto: 'RTO',
    failed: 'Failed',
    cancelled: 'Cancelled',
    processing: 'Processing',
    packed: 'Packed',
    created: 'Processing'
  };
  return map[normalized] || toTitleCase(normalized) || null;
};

export async function GET() {
  try {
    const { userId } = await requireUser({ allowAdmin: true });

    await connectDB();

    const orders = await OrderV2.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!orders.length) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orderIds = orders.map((order) => order._id);

    const addressIds = orders
      .map((order) => order.shippingAddressId)
      .filter(Boolean);

    const variantIds = orders
      .flatMap((order) => (order.items || []).map((item) => item.variantId))
      .filter(Boolean);

    const [addresses, variants, shipments] = await Promise.all([
      addressIds.length ? Address.find({ _id: { $in: addressIds } }).lean() : [],
      variantIds.length ? ProductVariant.find({ _id: { $in: variantIds } }).lean() : [],
      Shipment.find({ orderId: { $in: orderIds } }).lean()
    ]);

    const productIds = variants.map((variant) => variant.productId).filter(Boolean);
    const products = productIds.length
      ? await ProductV2.find({ _id: { $in: productIds } }, 'name brand category productCode').lean()
      : [];

    const addressMap = new Map(addresses.map((address) => [String(address._id), address]));
    const variantMap = new Map(variants.map((variant) => [String(variant._id), variant]));
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const shipmentMap = new Map(shipments.map((shipment) => [String(shipment.orderId), shipment]));

    const responseOrders = orders.map((order) => {
      const shipment = shipmentMap.get(String(order._id)) || null;
      const items = (order.items || []).map((item) => {
        const isCustomDesign = Boolean(item?.isCustomDesign || item?.customDesignId);
        if (isCustomDesign) {
          return {
            product: null,
            quantity: item.quantity,
            price: item.unitPrice,
            color: item.color || null,
            size: item.size || null,
            sku: item.sku,
            isCustomDesign: true,
            customDesignId: item.customDesignId || null,
            customDesignImage: item.customDesignImage || null,
            designName: item.designName || null,
            name: item.designName || 'Custom Design',
            image: item.customDesignImage ? [item.customDesignImage] : []
          };
        }

        const variant = variantMap.get(String(item.variantId));
        const product = variant ? productMap.get(String(variant.productId)) : null;

        const productImage = variant?.images || [];
        const productName = product?.name || 'Product';

        return {
          product: product
            ? {
                _id: product._id,
                productCode: product.productCode || null,
                name: product.name,
                brand: product.brand,
                category: product.category,
                image: productImage,
                offerPrice: variant?.offerPrice ?? 0,
                price: variant?.originalPrice ?? variant?.offerPrice ?? 0
              }
            : null,
          quantity: item.quantity,
          price: item.unitPrice,
          color: variant?.color,
          size: variant?.size,
          sku: item.sku,
          name: productName,
          image: productImage,
          isCustomDesign: false
        };
      });

      return {
        _id: order._id,
        orderCode: order.orderCode || null,
        userId: order.userId,
        items,
        amount: order.grandTotal,
        totalAmount: order.grandTotal,
        address: addressMap.get(String(order.shippingAddressId)) || null,
        status: formatOrderStatus(order.status),
        paymentMethod: order.paymentMethod,
        paymentStatus: toTitleCase(order.paymentStatus || 'Pending'),
        date: toSeconds(order.createdAt),
        createdAt: order.createdAt,
        shipment_status: formatShipmentStatus(shipment?.externalStatus || shipment?.status || order.status),
        awb_code: shipment?.awb || shipment?.awbCode || null,
        tracking_url: shipment?.trackingUrl || null,
        courier_name: shipment?.courier || null,
        paymentDetails: null
      };
    });

    return NextResponse.json({ success: true, orders: responseOrders });
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    }, { status });
  }
}

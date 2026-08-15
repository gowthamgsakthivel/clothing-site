import mongoose from 'mongoose';
import connectDB from '@/config/db';
import OrderV2 from '@/models/v2/Order';
import PaymentAudit from '@/models/PaymentAudit';
import WebhookEvent from '@/models/WebhookEvent';
import { buildError } from '@/lib/errors';
import Shipment from '@/models/v2/Shipment';
import User from '@/models/User';
import Address from '@/models/Address';
import ProductVariant from '@/models/v2/ProductVariant';
import ProductV2 from '@/models/v2/Product';
import { toNumber } from '@/lib/validation';
import { generateOrderCode } from '@/lib/codeGenerators';
import {
  reserveStock,
  releaseReservedStock,
  deductStockAfterShipment
} from '@/services/inventory/InventoryService.server';
import { createShipment, markAsPacked } from '@/services/shipments/ShipmentService';

const isCustomDesignItem = (item) => {
  return Boolean(item?.isCustomDesign || item?.customDesignId || (!item?.variantId && item?.designName));
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || !items.length) {
    throw buildError({ message: 'Order items are required', status: 400, code: 'ITEMS_REQUIRED' });
  }

  return items.map((item, index) => {
    const isCustom = isCustomDesignItem(item);
    const fallbackSku = isCustom ? `custom_${item?.customDesignId || index + 1}` : '';
    const sku = item?.sku?.trim() || fallbackSku;
    const quantity = toNumber(item?.quantity, 0);
    const unitPrice = toNumber(item?.unitPrice, 0);
    const totalPrice = toNumber(item?.totalPrice, unitPrice * quantity);

    if (!sku) {
      throw buildError({ message: `Item ${index + 1} SKU is required`, status: 400, code: 'SKU_REQUIRED' });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw buildError({ message: `Item ${index + 1} quantity is invalid`, status: 400, code: 'INVALID_QUANTITY' });
    }

    return {
      variantId: item?.variantId || undefined,
      sku,
      quantity,
      unitPrice,
      totalPrice,
      isCustomDesign: isCustom,
      customDesignId: item?.customDesignId || null,
      designName: item?.designName || item?.customDesignName || null,
      customDesignImage: item?.customDesignImage || null,
      size: item?.size || null,
      color: item?.color || null
    };
  });
};

const calculateTotals = (items, orderData) => {
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const discountTotal = toNumber(orderData?.discountTotal, 0);
  const taxTotal = toNumber(orderData?.taxTotal, 0);
  const shippingTotal = toNumber(orderData?.shippingTotal, 0);
  const grandTotal = toNumber(orderData?.grandTotal, subtotal - discountTotal + taxTotal + shippingTotal);

  return {
    subtotal,
    discountTotal,
    taxTotal,
    shippingTotal,
    grandTotal
  };
};

const createOrder = async (orderData) => {
  await connectDB();

  const userId = orderData?.userId;
  if (!userId) {
    throw buildError({ message: 'User ID is required', status: 400, code: 'USER_REQUIRED' });
  }

  const items = normalizeItems(orderData?.items);
  const totals = calculateTotals(items, orderData);
  const orderId = new mongoose.Types.ObjectId();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const orderCode = await generateOrderCode({ session });

      for (const item of items) {
        if (isCustomDesignItem(item)) {
          continue;
        }
        await reserveStock(item.sku, item.quantity, `order:${orderId}`, userId, { session });
      }

      const paymentMetadata = {};
      // Accept explicit payment details when available (e.g., from client after Razorpay verification)
      if (orderData?.paymentDetails) {
        paymentMetadata.razorpay_order_id = orderData.paymentDetails.orderId || null;
        paymentMetadata.razorpay_payment_id = orderData.paymentDetails.paymentId || null;
        paymentMetadata.razorpay_signature = orderData.paymentDetails.signature || null;
      } else if (orderData?.razorpay_order_id || orderData?.razorpay_payment_id) {
        paymentMetadata.razorpay_order_id = orderData.razorpay_order_id || null;
        paymentMetadata.razorpay_payment_id = orderData.razorpay_payment_id || null;
        paymentMetadata.razorpay_signature = orderData.razorpay_signature || null;
      }

      await OrderV2.create([
        {
          _id: orderId,
          orderCode,
          userId,
          status: 'placed',
          paymentStatus: (orderData?.paymentStatus || 'pending').toString().toLowerCase(),
          paymentMethod: orderData?.paymentMethod || 'COD',
          items,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          shippingTotal: totals.shippingTotal,
          grandTotal: totals.grandTotal,
          shippingAddressId: orderData?.shippingAddressId || null,
          inventoryReservedAt: new Date(),
          paymentMetadata: Object.keys(paymentMetadata).length ? paymentMetadata : undefined
        }
      ], { session });

      // Automatically clear user's cart in database upon successful order creation
      await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } }, { session }).catch(() => {});
    });
  } catch (txError) {
    if (txError?.message?.includes('Transaction') || txError?.message?.includes('standalone')) {
      const orderCode = await generateOrderCode({});
      for (const item of items) {
        if (!isCustomDesignItem(item)) {
          await reserveStock(item.sku, item.quantity, `order:${orderId}`, userId);
        }
      }

      const paymentMetadata = {};
      if (orderData?.paymentDetails) {
        paymentMetadata.razorpay_order_id = orderData.paymentDetails.orderId || null;
        paymentMetadata.razorpay_payment_id = orderData.paymentDetails.paymentId || null;
        paymentMetadata.razorpay_signature = orderData.paymentDetails.signature || null;
      }

      await OrderV2.create({
        _id: orderId,
        orderCode,
        userId,
        status: 'placed',
        paymentStatus: (orderData?.paymentStatus || 'pending').toString().toLowerCase(),
        paymentMethod: orderData?.paymentMethod || 'COD',
        items,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        shippingTotal: totals.shippingTotal,
        grandTotal: totals.grandTotal,
        shippingAddressId: orderData?.shippingAddressId || null,
        inventoryReservedAt: new Date(),
        paymentMetadata: Object.keys(paymentMetadata).length ? paymentMetadata : undefined
      });

      await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } }).catch(() => {});
    } else {
      throw txError;
    }
  } finally {
    await session.endSession();
  }

  // Double check user cart is cleared in database
  await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } }).catch(() => {});

  const order = await OrderV2.findById(orderId).lean();
  return { order };
};

const cancelOrder = async (orderId, { reason = 'Cancelled by store admin', notes = null, cancelledBy = 'admin' } = {}) => {
  await connectDB();

  const session = await mongoose.startSession();
  let order;
  let shipment;
  try {
    await session.withTransaction(async () => {
      order = await OrderV2.findById(orderId).session(session);
      if (!order) {
        throw buildError({ message: 'Order not found', status: 404, code: 'ORDER_NOT_FOUND' });
      }

      if (['shipped', 'delivered'].includes(order.status)) {
        throw buildError({ message: 'Shipped orders cannot be cancelled', status: 409, code: 'ORDER_SHIPPED' });
      }

      if (order.status === 'cancelled') {
        throw buildError({ message: 'Order is already cancelled', status: 409, code: 'ORDER_CANCELLED' });
      }

      if (!['placed', 'pending', 'packed'].includes(order.status)) {
        throw buildError({ message: 'Order cannot be cancelled', status: 409, code: 'ORDER_NOT_CANCELLABLE' });
      }

      for (const item of order.items || []) {
        if (isCustomDesignItem(item)) {
          continue;
        }
        await releaseReservedStock(item.sku, item.quantity, `order:${order._id}`, order.userId, { session });
      }

      order.status = 'cancelled';
      order.cancellationReason = reason || 'Cancelled by store admin';
      order.cancellationNotes = notes || null;
      order.cancelledBy = cancelledBy || 'admin';
      order.cancelledAt = new Date();

      if (order.paymentStatus === 'paid') {
        order.refundStatus = 'initiated';
      }

      await order.save({ session });

      shipment = await Shipment.findOne({ orderId }).session(session);
      if (shipment) {
        shipment.status = 'cancelled';
        shipment.externalStatus = shipment.externalStatus || 'cancelled';
        await shipment.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  return { order, shipment: shipment || null };
};

const updateRefundStatus = async (orderId, { refundStatus = 'completed', refundId = null } = {}) => {
  await connectDB();
  const order = await OrderV2.findById(orderId);
  if (!order) {
    throw buildError({ message: 'Order not found', status: 404, code: 'ORDER_NOT_FOUND' });
  }

  order.refundStatus = refundStatus;
  if (refundStatus === 'completed') {
    order.paymentStatus = 'refunded';
  }
  if (refundId && !order.paymentMetadata?.refunds?.some((r) => r.id === refundId)) {
    if (!order.paymentMetadata) order.paymentMetadata = {};
    if (!order.paymentMetadata.refunds) order.paymentMetadata.refunds = [];
    order.paymentMetadata.refunds.push({
      id: refundId,
      status: refundStatus,
      amount: order.grandTotal,
      createdAt: new Date()
    });
  }

  await order.save();
  return { order };
};

const confirmShipment = async (orderId) => {
  await connectDB();

  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      order = await OrderV2.findById(orderId).session(session);
      if (!order) {
        throw buildError({ message: 'Order not found', status: 404, code: 'ORDER_NOT_FOUND' });
      }

      if (order.status === 'shipped') {
        throw buildError({ message: 'Order is already shipped', status: 409, code: 'ORDER_SHIPPED' });
      }

      if (order.status === 'cancelled') {
        throw buildError({ message: 'Cancelled orders cannot be shipped', status: 409, code: 'ORDER_CANCELLED' });
      }

      for (const item of order.items || []) {
        if (isCustomDesignItem(item)) {
          continue;
        }
        await deductStockAfterShipment(item.sku, item.quantity, `order:${order._id}`, order.userId, { session });
      }

      order.status = 'shipped';
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { order };
};

const packOrder = async (orderId, packageDetails) => {
  await connectDB();

  const existingShipment = await Shipment.findOne({ orderId }).lean();
  if (!existingShipment) {
    await createShipment(orderId);
  }

  const result = await markAsPacked(orderId, packageDetails);
  return { orderId, shipment: result?.data || null };
};

const shipOrder = async (orderId) => {
  await connectDB();

  const session = await mongoose.startSession();
  let order;
  let shipment;

  try {
    await session.withTransaction(async () => {
      order = await OrderV2.findById(orderId).session(session);
      if (!order) {
        throw buildError({ message: 'Order not found', status: 404, code: 'ORDER_NOT_FOUND' });
      }

      if (order.status !== 'packed') {
        throw buildError({ message: 'Only packed orders can be shipped', status: 409, code: 'INVALID_STATUS' });
      }

      shipment = await Shipment.findOne({ orderId }).session(session);
      if (!shipment) {
        throw buildError({ message: 'Shipment not found', status: 404, code: 'SHIPMENT_NOT_FOUND' });
      }

      if (shipment.status !== 'packed') {
        throw buildError({ message: 'Shipment must be packed before shipping', status: 409, code: 'INVALID_STATUS' });
      }

      for (const item of order.items || []) {
        if (isCustomDesignItem(item)) {
          continue;
        }
        await deductStockAfterShipment(item.sku, item.quantity, `order:${order._id}`, order.userId, { session });
      }

      shipment.status = 'shipped';
      await shipment.save({ session });

      order.status = 'shipped';
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { order, shipment };
};

const deliverOrder = async (orderId) => {
  await connectDB();

  const session = await mongoose.startSession();
  let order;
  let shipment;

  try {
    await session.withTransaction(async () => {
      order = await OrderV2.findById(orderId).session(session);
      if (!order) {
        throw buildError({ message: 'Order not found', status: 404, code: 'ORDER_NOT_FOUND' });
      }

      if (order.status !== 'shipped') {
        throw buildError({ message: 'Only shipped orders can be delivered', status: 409, code: 'INVALID_STATUS' });
      }

      shipment = await Shipment.findOne({ orderId }).session(session);
      if (!shipment) {
        throw buildError({ message: 'Shipment not found', status: 404, code: 'SHIPMENT_NOT_FOUND' });
      }

      if (shipment.status !== 'shipped') {
        throw buildError({ message: 'Shipment must be shipped before delivery', status: 409, code: 'INVALID_STATUS' });
      }

      shipment.status = 'delivered';
      await shipment.save({ session });

      order.status = 'delivered';
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { order, shipment };
};

const getOrdersWithPagination = async ({
  page = 1,
  limit = 20,
  status,
  search,
  sort = 'createdAt',
  order = 'desc'
} = {}) => {
  await connectDB();

  const filters = {};
  if (status) {
    filters.status = status;
  }
  if (search) {
    const term = search.toString().trim();
    if (term) {
      filters.$or = [
        { orderCode: { $regex: term, $options: 'i' } },
        { userId: { $regex: term, $options: 'i' } },
        { 'items.sku': { $regex: term, $options: 'i' } }
      ];
    }
  }

  const safeOrder = order === 'asc' ? 1 : -1;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    OrderV2.find(filters)
      .sort({ [sort]: safeOrder })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    OrderV2.countDocuments(filters)
  ]);

  const orderIds = orders.map((orderDoc) => orderDoc._id);
  const shipments = orderIds.length
    ? await Shipment.find({ orderId: { $in: orderIds } }).lean()
    : [];

  const shipmentMap = shipments.reduce((acc, shipment) => {
    acc[shipment.orderId.toString()] = shipment;
    return acc;
  }, {});

  const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).select('name email').lean()
    : [];
  const userMap = users.reduce((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  // Collect all variant IDs and SKUs across all orders to hydrate items in one single query
  const allVariantIds = [
    ...new Set(
      orders.flatMap((o) => (o.items || []).map((i) => i.variantId).filter(Boolean))
    )
  ];
  const allSkus = [
    ...new Set(
      orders.flatMap((o) => (o.items || []).map((i) => i.sku).filter(Boolean))
    )
  ];

  const orQueries = [];
  if (allVariantIds.length) orQueries.push({ _id: { $in: allVariantIds } });
  if (allSkus.length) orQueries.push({ sku: { $in: allSkus } });

  const variants = orQueries.length
    ? await ProductVariant.find({ $or: orQueries })
        .populate('productId', 'name productCode brand category genderCategory sportCategory slug image images')
        .lean()
    : [];

  const variantIdMap = {};
  const variantSkuMap = {};

  variants.forEach((v) => {
    if (v._id) variantIdMap[v._id.toString()] = v;
    if (v.sku) variantSkuMap[v.sku.toString()] = v;
  });

  const decodeSkuFallback = (sku) => {
    if (!sku || typeof sku !== 'string') return {};
    const parts = sku.split('-');
    if (parts.length >= 5) {
      const rawCat = parts[1]?.toUpperCase();
      const rawBrand = parts[2]?.toUpperCase();
      const rawColor = parts[3]?.toUpperCase();
      const rawSize = parts[4]?.toUpperCase();

      const categoryMap = {
        'TSH': 'T-Shirts', 'SHO': 'Shorts', 'JAC': 'Jackets', 'JER': 'Jerseys',
        'POL': 'Polo T-Shirts', 'HOO': 'Hoodies', 'TRA': 'Track Pants', 'CAP': 'Caps'
      };
      const brandMap = {
        'PUM': 'Puma', 'NIK': 'Nike', 'ADI': 'Adidas', 'SPA': 'Sparrow Sports',
        'UND': 'Under Armour', 'REE': 'Reebok'
      };
      const colorMap = {
        'BLA': 'Black', 'WHI': 'White', 'RED': 'Red', 'BLU': 'Blue', 'NAV': 'Navy Blue',
        'GRE': 'Green', 'YEL': 'Yellow', 'ORA': 'Orange', 'PUR': 'Purple', 'PIN': 'Pink',
        'GRA': 'Grey', 'ROY': 'Royal Blue', 'MAR': 'Maroon', 'TEA': 'Teal'
      };
      const sizeMap = {
        'XS': 'XS', 'SX': 'S', 'SM': 'S', 'MX': 'M', 'MD': 'M', 'LX': 'L', 'LG': 'L',
        'XL': 'XL', '2X': '2XL', 'XX': 'XXL', '3X': '3XL'
      };

      return {
        category: categoryMap[rawCat] || rawCat,
        brand: brandMap[rawBrand] || rawBrand,
        color: colorMap[rawColor] || rawColor,
        size: sizeMap[rawSize] || rawSize.replace(/X$/, '') || rawSize
      };
    }
    return {};
  };

  const data = orders.map((orderDoc) => {
    const hydratedItems = (orderDoc.items || []).map((item) => {
      const variant = (item.variantId ? variantIdMap[item.variantId.toString()] : null) || (item.sku ? variantSkuMap[item.sku.toString()] : null);
      const fallback = decodeSkuFallback(item.sku);

      const productName = item.designName || variant?.productId?.name || item.productName || item.sku || 'Sports Apparel';
      const brand = variant?.productId?.brand || fallback.brand || 'Sparrow Sports';
      const category = variant?.productId?.category || fallback.category || 'Sportswear';
      const color = item.color || variant?.color || fallback.color || null;
      const size = item.size || variant?.size || fallback.size || null;
      const productCode = variant?.productId?.productCode || null;
      const productId = variant?.productId?._id?.toString() || null;
      const productImage = variant?.images?.[0] || variant?.productId?.images?.[0] || variant?.productId?.image?.[0] || item.customDesignImage || null;

      return {
        ...item,
        productId,
        productName,
        brand,
        category,
        color,
        size,
        productCode,
        productImage
      };
    });

    return {
      ...orderDoc,
      items: hydratedItems,
      orderCode: orderDoc.orderCode || null,
      shipment: shipmentMap[orderDoc._id.toString()] || null,
      customerName: userMap[orderDoc.userId]?.name || orderDoc.userId,
      customerEmail: userMap[orderDoc.userId]?.email || null
    };
  });

  return {
    orders: data,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      total
    }
  };
};

const getOrderById = async (orderId) => {
  await connectDB();

  const order = await OrderV2.findById(orderId).lean();
  if (!order) {
    throw buildError({ message: 'Order not found', status: 404, code: 'ORDER_NOT_FOUND' });
  }

  const shipment = await Shipment.findOne({ orderId: order._id }).lean();

  const user = order.userId ? await User.findById(order.userId).select('name email').lean() : null;
  const address = order.shippingAddressId ? await Address.findById(order.shippingAddressId).lean() : null;

  const allVariantIds = (order.items || []).map((i) => i.variantId).filter(Boolean);
  const allSkus = (order.items || []).map((i) => i.sku).filter(Boolean);

  const orQueries = [];
  if (allVariantIds.length) orQueries.push({ _id: { $in: allVariantIds } });
  if (allSkus.length) orQueries.push({ sku: { $in: allSkus } });

  const variants = orQueries.length
    ? await ProductVariant.find({ $or: orQueries })
        .populate('productId', 'name productCode brand category genderCategory sportCategory slug image images')
        .lean()
    : [];

  const variantIdMap = {};
  const variantSkuMap = {};

  variants.forEach((v) => {
    if (v._id) variantIdMap[v._id.toString()] = v;
    if (v.sku) variantSkuMap[v.sku.toString()] = v;
  });

  const decodeSkuFallback = (sku) => {
    if (!sku || typeof sku !== 'string') return {};
    const parts = sku.split('-');
    if (parts.length >= 5) {
      const rawCat = parts[1]?.toUpperCase();
      const rawBrand = parts[2]?.toUpperCase();
      const rawColor = parts[3]?.toUpperCase();
      const rawSize = parts[4]?.toUpperCase();

      const categoryMap = {
        'TSH': 'T-Shirts', 'SHO': 'Shorts', 'JAC': 'Jackets', 'JER': 'Jerseys',
        'POL': 'Polo T-Shirts', 'HOO': 'Hoodies', 'TRA': 'Track Pants', 'CAP': 'Caps'
      };
      const brandMap = {
        'PUM': 'Puma', 'NIK': 'Nike', 'ADI': 'Adidas', 'SPA': 'Sparrow Sports',
        'UND': 'Under Armour', 'REE': 'Reebok'
      };
      const colorMap = {
        'BLA': 'Black', 'WHI': 'White', 'RED': 'Red', 'BLU': 'Blue', 'NAV': 'Navy Blue',
        'GRE': 'Green', 'YEL': 'Yellow', 'ORA': 'Orange', 'PUR': 'Purple', 'PIN': 'Pink',
        'GRA': 'Grey', 'ROY': 'Royal Blue', 'MAR': 'Maroon', 'TEA': 'Teal'
      };
      const sizeMap = {
        'XS': 'XS', 'SX': 'S', 'SM': 'S', 'MX': 'M', 'MD': 'M', 'LX': 'L', 'LG': 'L',
        'XL': 'XL', '2X': '2XL', 'XX': 'XXL', '3X': '3XL'
      };

      return {
        category: categoryMap[rawCat] || rawCat,
        brand: brandMap[rawBrand] || rawBrand,
        color: colorMap[rawColor] || rawColor,
        size: sizeMap[rawSize] || rawSize.replace(/X$/, '') || rawSize
      };
    }
    return {};
  };

  const hydratedItems = (order.items || []).map((item) => {
    const variant = (item.variantId ? variantIdMap[item.variantId.toString()] : null) || (item.sku ? variantSkuMap[item.sku.toString()] : null);
    const fallback = decodeSkuFallback(item.sku);

    const productName = item.designName || variant?.productId?.name || item.productName || item.sku || 'Sports Apparel';
    const brand = variant?.productId?.brand || fallback.brand || 'Sparrow Sports';
    const category = variant?.productId?.category || fallback.category || 'Sportswear';
    const color = item.color || variant?.color || fallback.color || null;
    const size = item.size || variant?.size || fallback.size || null;
    const productCode = variant?.productId?.productCode || null;
    const productId = variant?.productId?._id?.toString() || null;
    const productImage = variant?.images?.[0] || variant?.productId?.images?.[0] || variant?.productId?.image?.[0] || item.customDesignImage || null;

    return {
      ...item,
      productId,
      productName,
      brand,
      category,
      color,
      size,
      productCode,
      productImage
    };
  });

  const hydratedOrder = {
    ...order,
    orderCode: order.orderCode || null,
    items: hydratedItems,
    customerName: user?.name || order.userId,
    customerEmail: user?.email || null,
    shippingAddress: address || null
  };

  return { order: hydratedOrder, shipment: shipment || null };
};

export { createOrder, cancelOrder, confirmShipment, packOrder, shipOrder, deliverOrder, getOrdersWithPagination, getOrderById, updateRefundStatus };

// Process Razorpay webhooks in an idempotent, replay-protected way.
// This function will NOT create application orders; it only updates existing orders
// with Razorpay payment metadata and status changes. Caller must validate webhook signature.
const processRazorpayWebhook = async (eventPayload, eventId) => {
  await connectDB();

  if (!eventId) {
    throw buildError({ message: 'Missing webhook event id', status: 400, code: 'MISSING_EVENT_ID' });
  }

  const eventType = eventPayload?.event || (eventPayload?.event && eventPayload.event);
  const paymentEntity = eventPayload?.payload?.payment?.entity || null;
  const refundEntity = eventPayload?.payload?.refund?.entity || null;

  if (!paymentEntity && !refundEntity) {
    // Nothing to act on
    return { handled: false, message: 'No payment or refund entity present' };
  }

  // Try to find an order that already has matching Razorpay ids
  const searchConditions = [];
  if (paymentEntity?.id) searchConditions.push({ 'paymentMetadata.razorpay_payment_id': paymentEntity.id });
  if (paymentEntity?.order_id) searchConditions.push({ 'paymentMetadata.razorpay_order_id': paymentEntity.order_id });

  let order = null;
  if (searchConditions.length) {
    order = await OrderV2.findOne({ $or: searchConditions });
  }

  if (!order) {
    // No matching order — create a payment audit record for reconciliation
    try {
      await PaymentAudit.create({ eventId, payload: eventPayload, receivedAt: new Date(), processed: false, reason: 'no_matching_order' });
    } catch (err) {
      // Best-effort: log and continue
    }
    return { handled: false, message: 'No matching order found' };
  }

  // Use a WebhookEvent collection to provide global replay protection / idempotency
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Attempt to insert a webhook event record for this eventId. If it already exists, the event was processed.
      try {
        await WebhookEvent.create([{ eventId, orderId: order._id, payload: eventPayload }], { session });
      } catch (err) {
        // Duplicate key error => event already processed
        const isDup = err && (err.code === 11000 || (err.message && err.message.includes('duplicate key')));
        if (isDup) {
          return;
        }
        throw err;
      }

      // Re-fetch the order in the transaction session
      const ord = await OrderV2.findById(order._id).session(session);
      if (!ord) throw buildError({ message: 'Order not found during webhook processing', status: 404 });

      // Ensure paymentMetadata exists
      ord.paymentMetadata = ord.paymentMetadata || { refunds: [] };

      // Update metadata and status based on event type
      if (eventType === 'payment.captured') {
        ord.paymentMetadata.razorpay_payment_id = paymentEntity.id || ord.paymentMetadata.razorpay_payment_id;
        ord.paymentMetadata.razorpay_order_id = paymentEntity.order_id || ord.paymentMetadata.razorpay_order_id;
        ord.paymentStatus = 'paid';
      } else if (eventType === 'payment.failed') {
        ord.paymentMetadata.razorpay_payment_id = paymentEntity.id || ord.paymentMetadata.razorpay_payment_id;
        ord.paymentMetadata.razorpay_order_id = paymentEntity.order_id || ord.paymentMetadata.razorpay_order_id;
        ord.paymentStatus = 'failed';
      } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
        const refund = refundEntity || {};
        // Avoid duplicate refunds in metadata
        const existing = (ord.paymentMetadata.refunds || []).find(r => r.id === refund.id);
        if (!existing) {
          ord.paymentMetadata.refunds = ord.paymentMetadata.refunds || [];
          ord.paymentMetadata.refunds.push({ id: refund.id, status: refund.status || eventType, amount: refund.amount || 0, createdAt: refund.created_at ? new Date(refund.created_at * 1000) : new Date() });
        }
        if (eventType === 'refund.processed') {
          ord.paymentStatus = 'refunded';
        }
      }

      // Save changes
      await ord.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { handled: true, message: 'Processed' };
};

export { processRazorpayWebhook };

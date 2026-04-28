import mongoose from 'mongoose';
import connectDB from '@/config/db';
import OrderV2 from '@/models/v2/Order';
import { buildError } from '@/lib/errors';
import Shipment from '@/models/v2/Shipment';
import User from '@/models/User';
import Address from '@/models/Address';
import ProductVariant from '@/models/v2/ProductVariant';
import ProductV2 from '@/models/v2/Product';
import { toNumber } from '@/lib/validation';
import {
  reserveStock,
  releaseReservedStock,
  deductStockAfterShipment
} from '@/services/inventory/InventoryService';
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
      for (const item of items) {
        if (isCustomDesignItem(item)) {
          continue;
        }
        await reserveStock(item.sku, item.quantity, `order:${orderId}`, userId, { session });
      }

      await OrderV2.create([
        {
          _id: orderId,
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
          inventoryReservedAt: new Date()
        }
      ], { session });
    });
  } finally {
    await session.endSession();
  }

  const order = await OrderV2.findById(orderId).lean();
  return { order };
};

const cancelOrder = async (orderId) => {
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

  const data = orders.map((orderDoc) => ({
    ...orderDoc,
    shipment: shipmentMap[orderDoc._id.toString()] || null,
    customerName: userMap[orderDoc.userId]?.name || orderDoc.userId,
    customerEmail: userMap[orderDoc.userId]?.email || null
  }));

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

  // Hydrate order items with actual product names
  const hydratedItems = await Promise.all(
    order.items.map(async (item) => {
      let productName = null;
      if (item.variantId) {
        const variant = await ProductVariant.findById(item.variantId)
          .populate('productId', 'name')
          .lean();
        if (variant?.productId?.name) {
          productName = variant.productId.name;
        }
      }
      return {
        ...item,
        productName
      };
    })
  );

  const hydratedOrder = {
    ...order,
    items: hydratedItems,
    customerName: user?.name || order.userId,
    customerEmail: user?.email || null,
    shippingAddress: address || null
  };

  return { order: hydratedOrder, shipment: shipment || null };
};

export { createOrder, cancelOrder, confirmShipment, packOrder, shipOrder, deliverOrder, getOrdersWithPagination, getOrderById };

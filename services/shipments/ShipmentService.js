import mongoose from 'mongoose';
import connectDB from '@/config/db';
import OrderV2 from '@/models/v2/Order';
import Shipment from '@/models/v2/Shipment';
import logger from '@/lib/logger';
import { buildError } from '@/lib/errors';
import { assignAwb as assignShiprocketAwb, createShipment as createShiprocketShipment } from '@/services/shiprocket/ShiprocketService';

const ensureOrder = (order) => {
  if (!order) {
    throw buildError({ message: 'Order not found', status: 404, code: 'ORDER_NOT_FOUND' });
  }
};

const ensureShipment = (shipment) => {
  if (!shipment) {
    throw buildError({ message: 'Shipment not found', status: 404, code: 'SHIPMENT_NOT_FOUND' });
  }
};

const createShipment = async (orderId) => {
  await connectDB();

  const session = await mongoose.startSession();
  let shipment;
  try {
    await session.withTransaction(async () => {
      const order = await OrderV2.findById(orderId).session(session);
      ensureOrder(order);

      if (order.status !== 'placed') {
        throw buildError({ message: 'Shipment can only be created for placed orders', status: 409, code: 'INVALID_STATUS' });
      }

      const existing = await Shipment.findOne({ orderId }).session(session);
      if (existing) {
        throw buildError({ message: 'Shipment already exists', status: 409, code: 'SHIPMENT_EXISTS' });
      }

      const shipmentId = `INT-${order._id.toString()}`;

      const created = await Shipment.create([
        {
          orderId: order._id,
          provider: 'internal',
          shipmentId,
          status: 'created'
        }
      ], { session });

      shipment = created?.[0];
    });
  } finally {
    await session.endSession();
  }

  logger.info('shipments.v2.create', { orderId, shipmentId: shipment?.shipmentId });
  return { shipment };
};

const markAsPacked = async (orderId) => {
  await connectDB();

  const session = await mongoose.startSession();
  let shipment;
  try {
    await session.withTransaction(async () => {
      const order = await OrderV2.findById(orderId).session(session);
      ensureOrder(order);

      if (order.status !== 'placed') {
        throw buildError({ message: 'Only placed orders can be packed', status: 409, code: 'INVALID_STATUS' });
      }

      shipment = await Shipment.findOne({ orderId }).session(session);
      ensureShipment(shipment);

      shipment.status = 'packed';
      await shipment.save({ session });

      order.status = 'packed';
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  let shiprocketSynced = false;
  try {
    const existingShipment = await Shipment.findOne({ orderId }).lean();
    if (existingShipment?.shiprocketShipmentId) {
      shiprocketSynced = true;
      logger.info('shipments.v2.shiprocket.already_synced', { orderId, shipmentId: existingShipment._id });
    } else {
      const order = await OrderV2.findById(orderId).lean();
      const shiprocketResult = await createShiprocketShipment(order);

      if (shiprocketResult.success) {
        const data = shiprocketResult.data || {};
        const shiprocketShipmentId = data.shipment_id || data.shipmentId || null;
        let awb = data.awb_code || data.awb || null;
        if (!awb && shiprocketShipmentId) {
          const courierCompanyId = data.courier_company_id || data.courierCompanyId || null;
          if (courierCompanyId) {
            const awbResult = await assignShiprocketAwb({ shipmentId: shiprocketShipmentId, courierCompanyId });
            if (awbResult.success) {
              const awbData = awbResult.data || {};
              awb = awbData.awb_code || awbData.awb || awb;
            } else {
              logger.warn('shipments.v2.shiprocket.awb_assign_failed', { orderId, error: awbResult.error });
            }
          } else {
            logger.warn('shipments.v2.shiprocket.awb_assign_skipped', { orderId, reason: 'courier_company_id_missing' });
          }
        }
        shipment = await Shipment.findOneAndUpdate(
          { orderId },
          {
            $set: {
              shiprocketShipmentId,
              awb,
              courier: data.courier_name || data.courier || data.courier_company_id || null,
              trackingId: data.tracking_id || data.trackingId || null,
              trackingUrl: data.tracking_url || data.trackingUrl || null,
              labelUrl: data.label_url || data.labelUrl || null,
              externalStatus: data.status || data.current_status || null,
              externalError: null,
              payload: shiprocketResult.payload || null
            }
          },
          { new: true }
        );
        shiprocketSynced = true;
      } else {
        await Shipment.findOneAndUpdate(
          { orderId },
          {
            $set: {
              externalStatus: 'failed',
              externalError: shiprocketResult.error || 'Shiprocket sync failed'
            }
          }
        );
        logger.warn('shipments.v2.shiprocket.sync_failed', { orderId, error: shiprocketResult.error });
      }
    }
  } catch (error) {
    await Shipment.findOneAndUpdate(
      { orderId },
      {
        $set: {
          externalStatus: 'failed',
          externalError: error?.message || 'Shiprocket sync error'
        }
      }
    );
    logger.error('shipments.v2.shiprocket.error', { orderId, message: error?.message });
  }

  logger.info('shipments.v2.packed', { orderId, shiprocketSynced });
  return { success: true, data: shipment, shiprocketSynced };
};

const retryShiprocketSync = async (shipmentId) => {
  await connectDB();

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) {
    throw buildError({ message: 'Shipment not found', status: 404, code: 'SHIPMENT_NOT_FOUND' });
  }

  if (shipment.externalStatus !== 'failed') {
    throw buildError({ message: 'Shipment is not eligible for retry', status: 409, code: 'INVALID_STATUS' });
  }

    if (shipment.shiprocketShipmentId) {
      logger.info('shipments.v2.shiprocket.already_synced', { shipmentId });
      return { success: true, data: shipment, shiprocketSynced: true };
    }

  let shiprocketSynced = false;
  try {
    const order = await OrderV2.findById(shipment.orderId).lean();
    const shiprocketResult = await createShiprocketShipment(order);

    if (shiprocketResult.success) {
      const data = shiprocketResult.data || {};
      const shiprocketShipmentId = data.shipment_id || data.shipmentId || null;
      let awb = data.awb_code || data.awb || null;
      if (!awb && shiprocketShipmentId) {
        const courierCompanyId = data.courier_company_id || data.courierCompanyId || null;
        if (courierCompanyId) {
          const awbResult = await assignShiprocketAwb({ shipmentId: shiprocketShipmentId, courierCompanyId });
          if (awbResult.success) {
            const awbData = awbResult.data || {};
            awb = awbData.awb_code || awbData.awb || awb;
          } else {
            logger.warn('shipments.v2.shiprocket.awb_assign_failed', { shipmentId, error: awbResult.error });
          }
        } else {
          logger.warn('shipments.v2.shiprocket.awb_assign_skipped', { shipmentId, reason: 'courier_company_id_missing' });
        }
      }
      const updated = await Shipment.findByIdAndUpdate(
        shipmentId,
        {
          $set: {
            shiprocketShipmentId,
            awb,
            courier: data.courier_name || data.courier || data.courier_company_id || null,
            trackingId: data.tracking_id || data.trackingId || null,
            trackingUrl: data.tracking_url || data.trackingUrl || null,
            labelUrl: data.label_url || data.labelUrl || null,
            externalStatus: data.status || data.current_status || null,
            externalError: null,
            payload: shiprocketResult.payload || null
          }
        },
        { new: true }
      );
      shiprocketSynced = true;
      return { success: true, data: updated, shiprocketSynced };
    }

    await Shipment.findByIdAndUpdate(
      shipmentId,
      { $set: { externalStatus: 'failed', externalError: shiprocketResult.error || 'Shiprocket sync failed' } }
    );
    return { success: true, data: shipment, shiprocketSynced };
  } catch (error) {
    await Shipment.findByIdAndUpdate(
      shipmentId,
      { $set: { externalStatus: 'failed', externalError: error?.message || 'Shiprocket sync error' } }
    );
    logger.error('shipments.v2.shiprocket.retry_error', { shipmentId, message: error?.message });
    return { success: true, data: shipment, shiprocketSynced };
  }
};

const markAsShipped = async (orderId) => {
  await connectDB();

  const session = await mongoose.startSession();
  let shipment;
  try {
    await session.withTransaction(async () => {
      const order = await OrderV2.findById(orderId).session(session);
      ensureOrder(order);

      if (order.status !== 'packed') {
        throw buildError({ message: 'Only packed orders can be shipped', status: 409, code: 'INVALID_STATUS' });
      }

      shipment = await Shipment.findOne({ orderId }).session(session);
      ensureShipment(shipment);

      if (shipment.status !== 'packed') {
        throw buildError({ message: 'Shipment must be packed before shipping', status: 409, code: 'INVALID_STATUS' });
      }

      shipment.status = 'shipped';
      await shipment.save({ session });

      order.status = 'shipped';
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  logger.info('shipments.v2.shipped', { orderId });
  return { shipment };
};

const markAsDelivered = async (orderId) => {
  await connectDB();

  const session = await mongoose.startSession();
  let shipment;
  try {
    await session.withTransaction(async () => {
      const order = await OrderV2.findById(orderId).session(session);
      ensureOrder(order);

      if (order.status !== 'shipped') {
        throw buildError({ message: 'Only shipped orders can be delivered', status: 409, code: 'INVALID_STATUS' });
      }

      shipment = await Shipment.findOne({ orderId }).session(session);
      ensureShipment(shipment);

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

  logger.info('shipments.v2.delivered', { orderId });
  return { shipment };
};

export { createShipment, markAsPacked, markAsShipped, markAsDelivered, retryShiprocketSync };

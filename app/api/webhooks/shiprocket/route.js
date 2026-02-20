import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Shipment from '@/models/v2/Shipment';
import ShipmentWebhookLog from '@/models/ShipmentWebhookLog';
import logger from '@/lib/logger';
import { markAsDelivered } from '@/services/shipments/ShipmentService';

const getWebhookSecret = () => process.env.SHIPROCKET_WEBHOOK_SECRET || '';

const normalizeExternalStatus = (rawStatus) => {
  if (!rawStatus) return 'unknown';
  const normalized = rawStatus.toString().trim().toLowerCase();

  if (normalized.includes('rto') || normalized.includes('return')) {
    return 'rto';
  }

  if (normalized.includes('delivered')) {
    return 'delivered';
  }

  if (normalized.includes('shipped') || normalized.includes('dispatched') || normalized.includes('in transit')) {
    return 'shipped';
  }

  if (normalized.includes('out for delivery') || normalized === 'ofd') {
    return 'out_for_delivery';
  }

  if (normalized.includes('cancel') || normalized.includes('fail') || normalized.includes('lost') || normalized.includes('undelivered')) {
    return 'failed';
  }

  return 'unknown';
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 120;
const rateLimitStore = new Map();
const isProduction = process.env.NODE_ENV === 'production';

const checkRateLimit = (key) => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return false;
  }
  return true;
};

export async function POST(request) {
  const receivedAt = new Date();
  const respond = (payload, status = 200) => {
    const responseStatus = isProduction ? 200 : status;
    return NextResponse.json(payload, { status: responseStatus });
  };

  const logWebhookEvent = async ({ orderId, awbCode, previousStatus, newStatus, rawPayload, errorReason }) => {
    try {
      await connectDB();
      await ShipmentWebhookLog.create({
        order_id: orderId || 'unknown',
        awb_code: awbCode || 'unknown',
        previous_status: previousStatus || null,
        new_status: newStatus || 'unknown',
        raw_payload: rawPayload,
        error_reason: errorReason || null,
        received_at: receivedAt
      });
    } catch (error) {
      logger.error('shiprocket.webhook.processing_error', {
        message: error?.message,
        reason: 'db_log_failed'
      });
    }
  };

  const resolveOrderIdFromPayload = (payload) => {
    return payload?.order_id || payload?.orderId || payload?.sr_order_id || payload?.srOrderId || null;
  };

  try {
    const secret = getWebhookSecret();
    const tokenHeader = request.headers.get('x-shiprocket-token') || request.headers.get('x-api-key');
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!checkRateLimit(clientIp)) {
      logger.warn('shiprocket.webhook.validation_failed', { reason: 'rate_limited', clientIp });
      await logWebhookEvent({
        orderId: null,
        awbCode: null,
        previousStatus: null,
        newStatus: 'rate_limited',
        rawPayload: null,
        errorReason: 'rate_limited'
      });
      return respond({ success: true }, 429);
    }

    if (!secret) {
      logger.warn('shiprocket.webhook.validation_failed', { reason: 'secret_missing' });
      await logWebhookEvent({
        orderId: null,
        awbCode: null,
        previousStatus: null,
        newStatus: 'secret_missing',
        rawPayload: null,
        errorReason: 'secret_missing'
      });
      return respond({ success: true }, 500);
    }

    if (!tokenHeader || tokenHeader !== secret) {
      logger.warn('shiprocket.webhook.validation_failed', { reason: 'invalid_secret' });
      await logWebhookEvent({
        orderId: null,
        awbCode: null,
        previousStatus: null,
        newStatus: 'invalid_secret',
        rawPayload: null,
        errorReason: 'invalid_secret'
      });
      return respond({ success: true }, 401);
    }

    let payload;
    let rawBody = '';
    try {
      rawBody = await request.text();
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch (error) {
      logger.warn('shiprocket.webhook.validation_failed', { reason: 'invalid_json', raw_payload: rawBody });
      await logWebhookEvent({
        orderId: null,
        awbCode: null,
        previousStatus: null,
        newStatus: 'invalid_json',
        rawPayload: rawBody || 'invalid_json',
        errorReason: 'invalid_json'
      });
      return respond({ success: true }, 400);
    }

    const shiprocketShipmentId = payload?.shipment_id || payload?.shipmentId || null;
    const awb = payload?.awb || payload?.awb_code || null;
    const trackingId = payload?.tracking_id || payload?.trackingId || null;
    const trackingUrl = payload?.tracking_url || payload?.trackingUrl || null;
    const courier = payload?.courier_name || payload?.courier || null;
    const rawStatus = payload?.current_status || payload?.shipment_status || payload?.status || null;
    const externalStatus = normalizeExternalStatus(rawStatus);

    if (!shiprocketShipmentId && !awb) {
      logger.warn('shiprocket.webhook.validation_failed', { reason: 'missing_identifier', raw_payload: payload });
      await logWebhookEvent({
        orderId: resolveOrderIdFromPayload(payload),
        awbCode: awb,
        previousStatus: null,
        newStatus: externalStatus || rawStatus || 'unknown',
        rawPayload: payload,
        errorReason: 'missing_identifier'
      });
      return respond({ success: true }, 400);
    }

    await connectDB();

    const shipment = await Shipment.findOne({
      $or: [
        shiprocketShipmentId ? { shiprocketShipmentId } : null,
        awb ? { awb } : null
      ].filter(Boolean)
    });

    if (!shipment) {
      logger.warn('shiprocket.webhook.validation_failed', {
        reason: 'shipment_not_found',
        shiprocketShipmentId,
        awb
      });
      await logWebhookEvent({
        orderId: resolveOrderIdFromPayload(payload),
        awbCode: awb,
        previousStatus: null,
        newStatus: externalStatus || rawStatus || 'unknown',
        rawPayload: payload,
        errorReason: 'shipment_not_found'
      });
      return respond({ success: true }, 404);
    }

    const previousStatus = shipment.externalStatus || null;
    const isStatusIdempotent = previousStatus === externalStatus;

    logger.info('shiprocket.webhook.received', {
      shipmentId: shipment._id,
      orderId: shipment.orderId?.toString(),
      previous_status: previousStatus,
      new_status: externalStatus || rawStatus,
      idempotent: isStatusIdempotent,
      raw_payload: payload
    });

    const hasTrackingUpdate = Boolean(
      (trackingId && trackingId !== shipment.trackingId)
      || (trackingUrl && trackingUrl !== shipment.trackingUrl)
      || (awb && awb !== shipment.awb)
      || (courier && courier !== shipment.courier)
    );

    if (!isStatusIdempotent || hasTrackingUpdate) {
      try {
        if (!isStatusIdempotent) {
          shipment.externalStatus = externalStatus;
        }
        if (trackingId) {
          shipment.trackingId = trackingId;
        }
        if (trackingUrl) {
          shipment.trackingUrl = trackingUrl;
        }
        if (awb) {
          shipment.awb = awb;
        }
        if (courier) {
          shipment.courier = courier;
        }
        shipment.externalError = null;

        await shipment.save();
      } catch (error) {
        logger.error('shiprocket.webhook.processing_error', {
          message: error?.message,
          reason: 'shipment_update_failed',
          shipmentId: shipment._id
        });
        await logWebhookEvent({
          orderId: shipment.orderId?.toString(),
          awbCode: shipment.awb || awb || 'unknown',
          previousStatus,
          newStatus: externalStatus || rawStatus || 'unknown',
          rawPayload: payload,
          errorReason: 'shipment_update_failed'
        });
        return respond({ success: true }, 500);
      }
    }

    await logWebhookEvent({
      orderId: shipment.orderId?.toString(),
      awbCode: shipment.awb || awb || 'unknown',
      previousStatus,
      newStatus: externalStatus || rawStatus || 'unknown',
      rawPayload: payload,
      errorReason: isStatusIdempotent ? 'idempotent' : null
    });

    if (externalStatus === 'delivered' && previousStatus !== 'delivered') {
      try {
        await markAsDelivered(shipment.orderId);
      } catch (error) {
        logger.warn('shiprocket.webhook.delivery_sync_failed', {
          orderId: shipment.orderId?.toString(),
          message: error?.message
        });
        await logWebhookEvent({
          orderId: shipment.orderId?.toString(),
          awbCode: shipment.awb || awb || 'unknown',
          previousStatus,
          newStatus: externalStatus || rawStatus || 'unknown',
          rawPayload: payload,
          errorReason: 'delivery_sync_failed'
        });
      }
    }

    return respond({ success: true }, 200);
  } catch (error) {
    logger.error('shiprocket.webhook.processing_error', { message: error?.message });
    await logWebhookEvent({
      orderId: null,
      awbCode: null,
      previousStatus: null,
      newStatus: 'processing_error',
      rawPayload: null,
      errorReason: 'processing_error'
    });
    return respond({ success: true }, 500);
  }
}

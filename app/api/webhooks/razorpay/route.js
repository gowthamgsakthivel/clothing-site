import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { processRazorpayWebhook } from '@/services/orders/OrderService';
import logger from '@/lib/logger';

const getWebhookSecret = () => process.env.RAZORPAY_WEBHOOK_SECRET || '';

const isProduction = process.env.NODE_ENV === 'production';

export async function POST(request) {
  const receivedAt = new Date();

  const respond = (payload, status = 200) => {
    const responseStatus = isProduction ? 200 : status;
    return NextResponse.json(payload, { status: responseStatus });
  };

  try {
    const secret = getWebhookSecret();
    if (!secret) {
      logger.warn('razorpay.webhook.missing_secret');
      return respond({ success: true, message: 'secret_missing' }, 500);
    }

    const sigHeader = request.headers.get('x-razorpay-signature');
    const eventIdHeader = request.headers.get('x-razorpay-event-id') || request.headers.get('x-razorpay-eventid') || request.headers.get('x-event-id');

    const rawBody = await request.text();

    if (!sigHeader) {
      logger.warn('razorpay.webhook.missing_signature');
      return respond({ success: true, message: 'missing_signature' }, 401);
    }

    // Compute HMAC SHA256 over the raw body using the webhook secret
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    // Timing-safe comparison
    const sigBuffer = Buffer.from(sigHeader);
    const expectedBuffer = Buffer.from(expected);
    const valid = sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!valid) {
      logger.warn('razorpay.webhook.invalid_signature', { receivedSignature: sigHeader });
      return respond({ success: true, message: 'invalid_signature' }, 401);
    }

    let payload = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch (err) {
      logger.warn('razorpay.webhook.invalid_json', { error: err?.message });
      return respond({ success: true, message: 'invalid_json' }, 400);
    }

    // Fallback event id generation when header or payload id missing
    let eventId = eventIdHeader || (payload && payload?.id) || null;
    if (!eventId) {
      // Use a deterministic fallback combining timestamp and raw body
      try {
        const fallback = crypto.createHash('sha256').update(rawBody + '|' + Date.now().toString() + '|' + Math.random().toString()).digest('hex');
        eventId = fallback;
      } catch (err) {
        eventId = `fallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      }
    }

    // Attach raw body for auditing if needed
    if (payload && !payload._raw) payload._raw = rawBody;

    try {
      const result = await processRazorpayWebhook(payload, eventId);
      logger.info('razorpay.webhook.processed', { eventId, result, receivedAt });
      return respond({ success: true, processed: result }, 200);
    } catch (err) {
      logger.error('razorpay.webhook.processing_error', { message: err?.message });
      return respond({ success: true, message: 'processing_error' }, 500);
    }
  } catch (error) {
    logger.error('razorpay.webhook.unexpected_error', { message: error?.message });
    return respond({ success: true, message: 'unexpected_error' }, 500);
  }
}

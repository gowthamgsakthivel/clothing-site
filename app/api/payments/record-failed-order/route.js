import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authRoles';
import connectDB from '@/config/db';
import PaymentAudit from '@/models/PaymentAudit';

const FALLBACK_REASON = 'order_creation_failed_after_payment_verification';

export async function POST(request) {
  try {
    const { userId } = await requireUser({ allowAdmin: true });
    await connectDB();

    const body = await request.json();
    const razorpay_payment_id = body?.razorpay_payment_id || null;
    const razorpay_order_id = body?.razorpay_order_id || null;
    const amount = Number(body?.amount ?? null);
    const errorMessage = body?.errorMessage || 'Order creation failed after payment verification';
    const timestamp = body?.timestamp ? new Date(body.timestamp) : new Date();

    if (!razorpay_payment_id && !razorpay_order_id) {
      return NextResponse.json({ success: false, message: 'Payment identifiers are required' }, { status: 400 });
    }

    const payload = {
      razorpay_payment_id,
      razorpay_order_id,
      amount: Number.isFinite(amount) ? amount : null,
      userId,
      errorMessage,
      timestamp: timestamp.toISOString(),
      source: 'razorpay_checkout_fallback'
    };

    const audit = await PaymentAudit.create({
      eventId: `fallback:${razorpay_payment_id || razorpay_order_id || Date.now()}`,
      razorpay_payment_id,
      razorpay_order_id,
      amount: Number.isFinite(amount) ? amount : null,
      userId,
      errorMessage,
      timestamp,
      receivedAt: timestamp,
      processed: false,
      reason: FALLBACK_REASON,
      payload
    });

    console.error('razorpay.payment.order_creation_failed_after_verification', {
      auditId: audit?._id?.toString?.() || null,
      userId,
      razorpay_payment_id,
      razorpay_order_id,
      amount: Number.isFinite(amount) ? amount : null,
      errorMessage,
      timestamp: timestamp.toISOString()
    });

    return NextResponse.json({ success: true, message: 'Payment audit recorded' });
  } catch (error) {
    console.error('razorpay.payment.audit_record_failed', {
      message: error?.message,
      stack: error?.stack
    });

    return NextResponse.json(
      { success: false, message: error?.message || 'Unable to record payment audit' },
      { status: error?.status || 500 }
    );
  }
}
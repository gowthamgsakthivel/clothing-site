import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import CustomDesign from '@/models/CustomDesign';
import PaymentAudit from '@/models/PaymentAudit';

const createError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const parseJsonBody = async (request) => {
    try {
        const body = await request.json();
        return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
    } catch {
        return null;
    }
};

const isValidRazorpayId = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidSignature = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value.trim());

const signaturesMatch = (expected, received) => {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required.'
            }, { status: 401 });
        }

        const body = await parseJsonBody(request);
        if (!body) {
            return NextResponse.json({
                success: false,
                message: 'Malformed JSON body'
            }, { status: 400 });
        }

        const razorpay_order_id = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id.trim() : '';
        const razorpay_payment_id = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id.trim() : '';
        const razorpay_signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature.trim() : '';

        if (!isValidRazorpayId(razorpay_order_id) || !isValidRazorpayId(razorpay_payment_id) || !isValidSignature(razorpay_signature)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid payment payload'
            }, { status: 400 });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            throw createError('Razorpay is not configured', 500);
        }

        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (!signaturesMatch(expectedSignature, razorpay_signature)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid signature'
            }, { status: 400 });
        }

        await connectDB();

        const audit = await PaymentAudit.findOne({ razorpay_order_id }).lean();
        if (!audit) {
            return NextResponse.json({
                success: false,
                message: 'Payment intent not found'
            }, { status: 404 });
        }

        if (String(audit.userId) !== String(userId)) {
            return NextResponse.json({
                success: false,
                message: 'Access denied'
            }, { status: 403 });
        }

        if (audit.processed) {
            return NextResponse.json({
                success: true,
                message: 'Payment already verified'
            });
        }

        if (audit.payload?.sourceType === 'custom_design' && audit.payload?.sourceId) {
            const design = await CustomDesign.findById(audit.payload.sourceId).lean();

            if (!design) {
                return NextResponse.json({
                    success: false,
                    message: 'Custom design not found'
                }, { status: 404 });
            }

            if (String(design.user) !== String(userId)) {
                return NextResponse.json({
                    success: false,
                    message: 'Access denied'
                }, { status: 403 });
            }

            await CustomDesign.updateOne(
                { _id: design._id },
                {
                    $set: {
                        advancePayment: {
                            amount: audit.amount,
                            method: 'Razorpay',
                            status: 'Paid',
                            details: {
                                razorpay_order_id,
                                razorpay_payment_id,
                                razorpay_signature
                            },
                            timestamp: new Date()
                        },
                        updatedAt: new Date()
                    }
                }
            );
        }

        await PaymentAudit.updateOne(
            { _id: audit._id },
            {
                $set: {
                    processed: true,
                    reason: 'verified',
                    payload: {
                        ...(audit.payload || {}),
                        verifiedAt: new Date().toISOString(),
                        razorpay_order_id,
                        razorpay_payment_id
                    }
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Payment verified'
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error?.message || 'Unable to verify payment'
        }, { status: error?.status || 500 });
    }
}

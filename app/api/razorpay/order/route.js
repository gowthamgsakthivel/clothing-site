import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import CustomDesign from '@/models/CustomDesign';
import PaymentAudit from '@/models/PaymentAudit';
import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import User from '@/models/User';

const CURRENCY = 'INR';
const TAX_RATE = 0.05;
const CUSTOM_DESIGN_RECEIPT_PATTERN = /^custom_design_([a-fA-F0-9]{24})$/;

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

const parseCartKey = (productKey) => {
    if (typeof productKey !== 'string' || !productKey.trim()) {
        return { productId: null, color: null, size: null };
    }

    const keyParts = productKey.split('_');
    const productId = keyParts[0];
    const color = keyParts[1] || null;
    const size = keyParts[2] || null;

    return { productId, color, size };
};

const normalizeReceipt = (receipt) => {
    if (typeof receipt !== 'string' || !receipt.trim()) {
        return '';
    }

    // Razorpay strictly enforces receipt length <= 40 characters
    return receipt.trim().slice(0, 40);
};

const createRazorpayClient = () => {
    let keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
    let keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    // Ignore placeholder ## strings
    if (keyId.startsWith('#')) keyId = '';
    if (keySecret.startsWith('#')) keySecret = '';

    if (!keyId || !keySecret) {
        throw createError('Razorpay credentials are not configured in environment variables', 500);
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
};

const resolveCustomDesignAmount = async ({ userId, customDesignId }) => {
    const design = await CustomDesign.findById(customDesignId).lean();

    if (!design) {
        throw createError('Custom design not found', 404);
    }

    if (String(design.user) !== String(userId)) {
        throw createError('Access denied', 403);
    }

    if (design.status !== 'approved' || !Number.isFinite(Number(design.quote?.amount)) || Number(design.quote.amount) <= 0) {
        throw createError('Custom design is not approved yet.', 400);
    }

    const shortId = String(customDesignId).slice(-12);
    const timeStamp = Date.now().toString().slice(-8);

    return {
        amountRupees: Number(design.quote.amount),
        sourceType: 'custom_design',
        sourceId: customDesignId,
        receipt: `cd_${shortId}_${timeStamp}`
    };
};

const resolveCartAmount = async ({ userId }) => {
    const user = await User.findById(userId).lean();

    if (!user) {
        throw createError('User profile not found', 404);
    }

    const cartEntries = Object.entries(user.cartItems || {}).filter(([, quantity]) => Number(quantity) > 0);

    if (!cartEntries.length) {
        throw createError('Cart is empty', 400);
    }

    let subtotal = 0;
    const lineItems = [];

    for (const [productKey, quantityValue] of cartEntries) {
        const quantity = Number(quantityValue);

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw createError(`Invalid quantity for cart item ${productKey}`, 400);
        }

        if (productKey.startsWith('custom_')) {
            const customDesignId = productKey.replace('custom_', '');
            if (!customDesignId) {
                throw createError(`Invalid cart item ${productKey}`, 400);
            }

            const design = await CustomDesign.findById(customDesignId).lean();
            if (!design) {
                throw createError('Custom design not found', 404);
            }

            if (String(design.user) !== String(userId)) {
                throw createError('Access denied', 403);
            }

            if (design.status !== 'approved' || !Number.isFinite(Number(design.quote?.amount)) || Number(design.quote.amount) <= 0) {
                throw createError('Custom design is not approved yet.', 400);
            }

            const unitPrice = Number(design.quote.amount);
            const totalPrice = unitPrice * quantity;
            subtotal += totalPrice;
            lineItems.push({
                type: 'custom_design',
                customDesignId,
                quantity,
                unitPrice,
                totalPrice
            });
            continue;
        }

        const { productId, color, size } = parseCartKey(productKey);
        if (!productId) {
            throw createError(`Invalid cart item ${productKey}`, 400);
        }

        const product = await ProductV2.findById(productId).lean();
        if (!product) {
            throw createError('Product not found', 404);
        }

        const variantQuery = { productId: product._id };
        if (color) {
            variantQuery.color = color;
        }
        if (size) {
            variantQuery.size = size;
        }

        let variant = await ProductVariant.findOne(variantQuery).lean();
        if (!variant) {
            variant = await ProductVariant.findOne({ productId: product._id }).lean();
        }

        if (!variant) {
            throw createError('Variant not found', 404);
        }

        if (variant.visibility === 'hidden') {
            throw createError('Variant is not available', 400);
        }

        const unitPrice = Number(variant.offerPrice ?? variant.originalPrice ?? 0);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw createError('Invalid product price', 400);
        }

        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;
        lineItems.push({
            variantId: variant._id,
            sku: variant.sku,
            quantity,
            unitPrice,
            totalPrice
        });
    }

    const taxTotal = Math.round(subtotal - (subtotal / 1.05));
    const shippingTotal = 0;
    const amountRupees = subtotal; // Product price is GST inclusive

    const userSuffix = String(userId).slice(-8);
    const timeStamp = Date.now().toString().slice(-8);

    return {
        amountRupees,
        sourceType: 'cart',
        lineItems,
        subtotal,
        taxTotal,
        shippingTotal,
        receipt: `cart_${userSuffix}_${timeStamp}`
    };
};

const resolvePaymentContext = async ({ userId, body }) => {
    const receipt = normalizeReceipt(body?.receipt);
    const customDesignId = body?.customDesignId || body?.designId || receipt.match(CUSTOM_DESIGN_RECEIPT_PATTERN)?.[1] || null;

    if (customDesignId) {
        return resolveCustomDesignAmount({ userId, customDesignId });
    }

    return resolveCartAmount({ userId });
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

        await connectDB();

        const body = await parseJsonBody(request);
        if (!body) {
            return NextResponse.json({
                success: false,
                message: 'Malformed JSON body'
            }, { status: 400 });
        }

        const currency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim().toUpperCase() : CURRENCY;

        if (currency !== CURRENCY) {
            return NextResponse.json({
                success: false,
                message: 'Unsupported currency'
            }, { status: 400 });
        }

        const requestedAmount = body.amount === undefined || body.amount === null || body.amount === ''
            ? null
            : Number(body.amount);

        if (requestedAmount !== null && (!Number.isFinite(requestedAmount) || requestedAmount <= 0)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid amount'
            }, { status: 400 });
        }

        const paymentContext = await resolvePaymentContext({ userId, body });
        if (!Number.isFinite(paymentContext.amountRupees) || paymentContext.amountRupees <= 0) {
            throw createError('Calculated amount is invalid', 400);
        }

        if (requestedAmount !== null && Math.abs(requestedAmount - paymentContext.amountRupees) > 0.01) {
            return NextResponse.json({
                success: false,
                message: 'Amount mismatch'
            }, { status: 400 });
        }

        const razorpay = createRazorpayClient();
        const finalReceipt = normalizeReceipt(body.receipt) || paymentContext.receipt;

        const order = await razorpay.orders.create({
            amount: Math.round(paymentContext.amountRupees * 100),
            currency: CURRENCY,
            receipt: finalReceipt,
            notes: {
                userId,
                sourceType: paymentContext.sourceType,
                sourceId: paymentContext.sourceId || '',
                amountRupees: String(paymentContext.amountRupees)
            }
        });

        await PaymentAudit.create({
            eventId: `razorpay_order:${order.id}`,
            razorpay_order_id: order.id,
            amount: paymentContext.amountRupees,
            userId,
            errorMessage: null,
            receivedAt: new Date(),
            processed: false,
            reason: paymentContext.sourceType === 'custom_design' ? 'custom_design_checkout' : 'cart_checkout',
            payload: {
                sourceType: paymentContext.sourceType,
                sourceId: paymentContext.sourceId || null,
                receipt: finalReceipt,
                amountRupees: paymentContext.amountRupees,
                taxTotal: paymentContext.taxTotal || 0,
                subtotal: paymentContext.subtotal || paymentContext.amountRupees,
                lineItems: paymentContext.lineItems || []
            }
        });

        return NextResponse.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error);
        return NextResponse.json({
            success: false,
            message: error?.message || 'Unable to create payment order'
        }, { status: error?.status || 500 });
    }
}

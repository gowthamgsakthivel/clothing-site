import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        const generated_signature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            return NextResponse.json({ success: true, message: 'Payment verified' });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

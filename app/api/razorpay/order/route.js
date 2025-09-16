import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { amount, currency, receipt } = await request.json();

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: currency || 'INR',
            receipt: receipt || `rcpt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json({ success: true, order });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

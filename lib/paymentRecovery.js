import axios from 'axios';

export const PAYMENT_RECOVERY_MESSAGE = 'Payment received successfully. Your order could not be created automatically. Our team has been notified and will resolve it shortly.';

export const recordPaymentRecoveryFallback = async ({
  razorpay_payment_id,
  razorpay_order_id,
  amount,
  userId,
  errorMessage,
  timestamp = new Date().toISOString()
}) => {
  if (!razorpay_payment_id && !razorpay_order_id) {
    return false;
  }

  try {
    const { data } = await axios.post('/api/payments/record-failed-order', {
      razorpay_payment_id,
      razorpay_order_id,
      amount,
      userId,
      errorMessage,
      timestamp
    });

    return Boolean(data?.success);
  } catch (error) {
    console.error('Failed to record Razorpay payment fallback audit', {
      message: error?.message,
      response: error?.response?.data
    });
    return false;
  }
};
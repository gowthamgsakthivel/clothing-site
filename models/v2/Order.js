import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isCustomDesign: { type: Boolean, default: false },
    customDesignId: { type: mongoose.Schema.Types.ObjectId, ref: 'customdesign', default: null },
    designName: { type: String, default: null },
    customDesignImage: { type: String, default: null },
    size: { type: String, default: null },
    color: { type: String, default: null }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, default: null },
    userId: { type: String, required: true },
    status: { type: String, default: 'placed' },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    shippingTotal: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, default: 'COD' },
      paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
      // Razorpay payment metadata
      paymentMetadata: {
        razorpay_order_id: { type: String, default: null, index: true },
        razorpay_payment_id: { type: String, default: null, index: true },
        razorpay_signature: { type: String, default: null },
        refunds: { type: [{ id: String, status: String, amount: Number, createdAt: Date }], default: [] }
      },
      // Note: processedWebhookEvents removed in favor of a dedicated WebhookEvent collection
    shippingAddressId: { type: String, default: null },
    inventoryReservedAt: { type: Date, default: null },
    // Cancellation & Refund Tracking
    cancellationReason: { type: String, default: null },
    cancellationNotes: { type: String, default: null },
    cancelledBy: { type: String, enum: ['admin', 'customer', 'system', null], default: null },
    cancelledAt: { type: Date, default: null },
    refundStatus: { type: String, enum: ['not_applicable', 'pending', 'initiated', 'completed', 'failed'], default: 'not_applicable' }
  },
  { timestamps: true }
);

let OrderV2;

if (mongoose.models.OrderV2) {
  OrderV2 = mongoose.models.OrderV2;
} else {
  // Define indexes only once during initial model registration
  orderSchema.index({ status: 1, createdAt: -1 });
  orderSchema.index({ orderCode: 1 }, { unique: true, sparse: true });
  
  OrderV2 = mongoose.model('OrderV2', orderSchema, 'orders_v2');
}

export default OrderV2;

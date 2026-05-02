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
    orderCode: { type: String, unique: true, sparse: true, default: null },
    userId: { type: String, required: true },
    status: { type: String, default: 'placed' },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    shippingTotal: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'pending' },
    shippingAddressId: { type: String, default: null },
    inventoryReservedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderCode: 1 }, { unique: true, sparse: true });

const OrderV2 = mongoose.models.OrderV2 || mongoose.model('OrderV2', orderSchema, 'orders_v2');

export default OrderV2;

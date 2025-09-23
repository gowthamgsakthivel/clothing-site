import mongoose from "mongoose";



const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'user' },
    items: [{
        product: { type: String, required: true, ref: 'product' },
        quantity: { type: Number, required: true },
        color: { type: String },
        size: { type: String },
        // Fields for custom design orders
        isCustomDesign: { type: Boolean, default: false },
        customDesignId: { type: mongoose.Schema.Types.ObjectId, ref: 'customdesign' },
        customDesignImage: { type: String }
    }],
    amount: { type: Number, required: true },
    address: { type: String, ref: 'address', required: true },
    status: { type: String, required: true, default: 'Order Placed' },
    paymentMethod: { type: String, required: true, default: 'COD' }, // COD or Razorpay
    paymentStatus: { type: String, required: true, default: 'Pending' }, // Pending or Paid
    date: { type: Number, required: true },
    paymentDetails: {
        type: Object,
        default: null
    } // For storing payment gateway details
})

const Order = mongoose.models.order || mongoose.model('order', orderSchema);

export default Order;
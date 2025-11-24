import mongoose from "mongoose";



const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'user' },
    items: [{
        product: {
            type: mongoose.Schema.Types.Mixed, // Can be ObjectId (for regular products) or String (for custom designs)
            required: true
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Unit price for this item
        color: { type: String },
        size: { type: String },
        // Fields for custom design orders
        isCustomDesign: { type: Boolean, default: false },
        customDesignId: { type: mongoose.Schema.Types.ObjectId, ref: 'customdesign' },
        customDesignImage: { type: String },
        designName: { type: String } // Name of the custom design
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
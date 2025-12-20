import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product'
        },
        productName: String,
        quantity: Number,
        price: Number,
        size: String,
        color: String,
        image: String
    }],
    reason: {
        type: String,
        required: true,
        enum: [
            'Wrong Item',
            'Defective Product',
            'Size Issue',
            'Color Different',
            'Quality Issue',
            'Changed Mind',
            'Better Price Found',
            'Other'
        ]
    },
    description: {
        type: String,
        required: true,
        maxLength: 500
    },
    images: [{
        type: String
    }],
    refundAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Picked Up', 'Refund Processed'],
        default: 'Pending'
    },
    adminResponse: {
        type: String
    },
    refundMethod: {
        type: String,
        enum: ['Original Payment Method', 'Store Credit', 'Bank Transfer'],
        default: 'Original Payment Method'
    },
    pickupScheduled: {
        type: Date
    },
    refundProcessedDate: {
        type: Date
    },
    trackingNumber: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const ReturnRequest = mongoose.models.returnrequest || mongoose.model('returnrequest', returnRequestSchema);

export default ReturnRequest;

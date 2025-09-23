import mongoose from 'mongoose';

const CustomDesignSchema = new mongoose.Schema({
    user: {
        type: String,
        ref: 'User',
        required: true
    },
    designImage: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    size: {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    preferredColor: {
        type: String
    },
    additionalNotes: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'quoted', 'negotiating', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order'
    },
    quote: {
        amount: {
            type: Number
        },
        message: {
            type: String
        },
        timestamp: {
            type: Date
        }
    },
    negotiationHistory: [{
        offerBy: {
            type: String,
            enum: ['seller', 'customer'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        message: {
            type: String
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    advancePayment: {
        amount: {
            type: Number
        },
        method: {
            type: String,
            enum: ['Razorpay', 'COD', 'Other']
        },
        status: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed', 'Refunded']
        },
        details: {
            type: Object
        },
        timestamp: {
            type: Date
        }
    },
    isPriority: {
        type: Boolean,
        default: false
    },
    sellerResponse: {
        message: {
            type: String
        },
        timestamp: {
            type: Date
        }
    },
    customerResponse: {
        message: {
            type: String
        },
        timestamp: {
            type: Date
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Check if the model exists before creating it
// Use lowercase 'customdesign' for consistency with MongoDB collection naming
export default mongoose.models.customdesign || mongoose.model('customdesign', CustomDesignSchema);
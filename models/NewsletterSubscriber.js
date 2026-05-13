import mongoose from 'mongoose';

const NewsletterSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    source: {
        type: String,
        trim: true,
        default: 'website'
    },
    status: {
        type: String,
        enum: ['active', 'unsubscribed'],
        default: 'active'
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });
NewsletterSubscriberSchema.index({ subscribedAt: -1 });

const NewsletterSubscriber = mongoose.models.NewsletterSubscriber || mongoose.model('NewsletterSubscriber', NewsletterSubscriberSchema);

export default NewsletterSubscriber;
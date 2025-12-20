import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: String, default: null }, // userId of referrer
  referrals: [{
    userId: { type: String, required: true },
    userName: { type: String },
    signedUpAt: { type: Date, default: Date.now },
    hasCompletedOrder: { type: Boolean, default: false },
    orderValue: { type: Number, default: 0 },
  }],
  totalReferrals: { type: Number, default: 0 },
  successfulReferrals: { type: Number, default: 0 }, // Referrals who made a purchase
  totalEarnings: { type: Number, default: 0 }, // In rupees
  availableBalance: { type: Number, default: 0 },
  withdrawnBalance: { type: Number, default: 0 },
  rewards: [{
    type: { type: String, enum: ['signup_bonus', 'referral_bonus', 'order_commission'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    referredUserId: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

referralSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);

export default Referral;

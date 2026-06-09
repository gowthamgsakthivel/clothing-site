import mongoose from 'mongoose';

const paymentAuditSchema = new mongoose.Schema({
  eventId: { type: String, default: null, index: true },
  receivedAt: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false },
  reason: { type: String, default: null },
  payload: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

let PaymentAudit;
if (mongoose.models.PaymentAudit) {
  PaymentAudit = mongoose.models.PaymentAudit;
} else {
  PaymentAudit = mongoose.model('PaymentAudit', paymentAuditSchema, 'payment_audits');
}

export default PaymentAudit;

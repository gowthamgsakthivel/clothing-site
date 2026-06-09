import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderV2', default: null },
  payload: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
});

let WebhookEvent;
if (mongoose.models.WebhookEvent) {
  WebhookEvent = mongoose.models.WebhookEvent;
} else {
  WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema, 'webhook_events');
}

export default WebhookEvent;

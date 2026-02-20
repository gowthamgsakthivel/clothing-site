import mongoose from "mongoose";

const shipmentWebhookLogSchema = new mongoose.Schema({
  order_id: { type: String, required: true },
  awb_code: { type: String, required: true },
  previous_status: { type: String, default: null },
  new_status: { type: String, required: true },
  raw_payload: { type: mongoose.Schema.Types.Mixed, required: true },
  error_reason: { type: String, default: null },
  received_at: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

const ShipmentWebhookLog = mongoose.models.shipment_webhook_log
  || mongoose.model('shipment_webhook_log', shipmentWebhookLogSchema);

export default ShipmentWebhookLog;

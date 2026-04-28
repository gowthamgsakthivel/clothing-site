import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderV2', required: true, index: true },
    provider: { type: String, default: 'shiprocket' },
    shipmentId: { type: String, required: true, unique: true },
    awbCode: { type: String, default: null },
    shiprocketShipmentId: { type: String, default: null, index: true },
    awb: { type: String, default: null, index: true },
    courier: { type: String, default: null },
    trackingId: { type: String, default: null },
    externalStatus: { type: String, default: null },
    externalError: { type: String, default: null },
    status: { type: String, default: 'created' },
    packageDetails: {
      lengthCm: { type: Number, default: null },
      breadthCm: { type: Number, default: null },
      heightCm: { type: Number, default: null },
      weightKg: { type: Number, default: null },
      volumetricWeightKg: { type: Number, default: null },
      chargeableWeightKg: { type: Number, default: null },
      updatedAt: { type: Date, default: null }
    },
    trackingUrl: { type: String, default: null },
    labelUrl: { type: String, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);



const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema, 'shipments');

export default Shipment;

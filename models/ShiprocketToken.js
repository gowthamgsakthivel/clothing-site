import mongoose from "mongoose";

const shiprocketTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

const ShiprocketToken = mongoose.models.shiprocket_token || mongoose.model('shiprocket_token', shiprocketTokenSchema);

export default ShiprocketToken;

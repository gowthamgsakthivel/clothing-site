import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    cartItems: { type: Object, default: {} },
    favorites: { type: [String], default: [] }, // Array of product IDs
    customDesigns: { type: Object, default: {} }, // Store custom design details
    stockNotifications: { type: [Object], default: [] }, // Array of {productId, colorCode, size, date} for stock notifications
}, { minimize: false })

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;
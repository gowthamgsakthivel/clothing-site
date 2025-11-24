import { products } from "@/assets/productData";
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "user" },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    genderCategory: { type: String, enum: ["Men", "Women", "Kids", "Girls", "Boys", "Unisex"], default: "Unisex" },
    brand: { type: String, required: true },

    // Enhanced inventory system
    inventory: [{
        color: {
            name: { type: String, required: true },    // "Red", "Blue", etc.
            code: { type: String, required: true },    // "#FF0000", "#0000FF"
            image: { type: String }                    // Optional: color-specific image
        },
        sizeStock: [{
            size: { type: String, required: true },        // "XS", "S", "M", "L", "XL", "XXL"
            quantity: { type: Number, default: 0 },        // Available stock
            lowStockThreshold: { type: Number, default: 5 }, // Alert threshold
            lastRestocked: { type: Date, default: Date.now }
        }]
    }],

    // Backward compatibility (computed from inventory)
    color: [{
        color: { type: String },
        stock: { type: Number }
    }],
    sizes: { type: [String] },
    stock: { type: Number, default: 0 },

    // Computed fields for quick access
    totalStock: { type: Number, default: 0 },
    availableSizes: { type: [String], default: [] },
    availableColors: [{ type: String }],

    // Stock settings
    stockSettings: {
        trackInventory: { type: Boolean, default: true },
        allowBackorders: { type: Boolean, default: false },
        globalLowStockThreshold: { type: Number, default: 10 }
    },

    date: { type: Number, required: true }
})
const Product = mongoose.models.product || mongoose.model('product', productSchema)

export default Product;
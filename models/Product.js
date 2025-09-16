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
    color: [{
        color: { type: String, required: true },
        stock: { type: Number, required: true }
    }],
    sizes: { type: [String], required: true },
    stock: { type: Number, required: true },
    date: { type: Number, required: true }
})
const Product = mongoose.models.product || mongoose.model('product', productSchema)

export default Product;
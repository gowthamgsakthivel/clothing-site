import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import User from '@/models/User';

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { design } = await request.json();

        // Validate design data
        if (!design || !design._id) {
            return NextResponse.json({
                success: false,
                message: "Invalid design data"
            });
        }

        await connectDB();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            });
        }

        // Initialize cartItems if undefined
        if (!user.cartItems) {
            user.cartItems = {};
        }

        // Ensure cartItems is treated as an object
        const cartItems = typeof user.cartItems === 'object' ? user.cartItems : {};

        // Create a unique key for the custom design
        const cartKey = `custom_${design._id}`;

        // Set the quantity to 1
        cartItems[cartKey] = 1;

        // Store design details in the cart object
        // We'll extend the cartItems schema to include custom design details
        if (!user.customDesigns) {
            user.customDesigns = {};
        }

        // Store the full design information
        user.customDesigns[design._id] = {
            designId: design._id,
            designName: design.designName || 'Custom Design',
            designImage: design.designImage || '',
            size: design.size || 'M',
            color: design.color || 'As specified',
            quote: design.quote || { amount: 1100000 }, // Default 11000 INR in paisa
            createdAt: new Date()
        };

        // Save the updated user object
        user.cartItems = cartItems;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Custom design added to cart",
            cartItems: user.cartItems,
            customDesigns: user.customDesigns
        });
    } catch (error) {
        console.error("Error adding custom design to cart:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to add custom design to cart"
        });
    }
}
import connectDB from "@/config/db";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import User from '@/models/User';
import CustomDesign from '@/models/CustomDesign';

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

        // Fetch the latest design data from CustomDesign collection to get accurate quote info
        const latestDesign = await CustomDesign.findById(design._id);
        if (!latestDesign) {
            return NextResponse.json({
                success: false,
                message: "Custom design not found"
            });
        }

        // Verify the user owns this design
        if (latestDesign.user !== userId) {
            return NextResponse.json({
                success: false,
                message: "You don't have permission to add this design to cart"
            });
        }

        // Only allow adding to cart if design is approved (has a quote)
        if (!latestDesign.quote || !latestDesign.quote.amount || latestDesign.status !== 'approved') {
            return NextResponse.json({
                success: false,
                message: "This design cannot be added to cart. Please wait for seller approval and quote."
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

        // Store the full design information using the latest data from database
        user.customDesigns[design._id] = {
            designId: latestDesign._id,
            designName: latestDesign.designName || 'Custom Design',
            designImage: latestDesign.designImage || '',
            size: latestDesign.size || 'M',
            color: latestDesign.color || 'As specified',
            quote: latestDesign.quote, // Use the actual quote from database
            status: latestDesign.status,
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
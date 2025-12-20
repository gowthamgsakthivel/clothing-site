import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Address from "@/models/Address";

// GET all addresses for the user
export async function GET(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const addresses = await Address.find({ userId }).sort({ isDefault: -1, _id: -1 });

        return NextResponse.json({
            success: true,
            addresses
        });

    } catch (error) {
        console.error("Error fetching addresses:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch addresses", error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new address
export async function POST(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const body = await req.json();
        const { fullName, phoneNumber, pincode, area, city, state, isDefault } = body;

        // Validate required fields
        if (!fullName || !phoneNumber || !pincode || !area || !city || !state) {
            return NextResponse.json(
                { success: false, message: "All fields are required" },
                { status: 400 }
            );
        }

        // If this is set as default, unset other default addresses
        if (isDefault) {
            await Address.updateMany(
                { userId, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        const newAddress = new Address({
            userId,
            fullName,
            phoneNumber,
            pincode: Number(pincode),
            area,
            city,
            state,
            isDefault: isDefault || false
        });

        await newAddress.save();

        return NextResponse.json({
            success: true,
            message: "Address added successfully",
            address: newAddress
        });

    } catch (error) {
        console.error("Error creating address:", error);
        return NextResponse.json(
            { success: false, message: "Failed to add address", error: error.message },
            { status: 500 }
        );
    }
}

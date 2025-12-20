import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Address from "@/models/Address";

// PUT - Update address
export async function PUT(req, { params }) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const { id } = await params;
        const body = await req.json();
        const { fullName, phoneNumber, pincode, area, city, state, isDefault } = body;

        // Verify the address belongs to the user
        const address = await Address.findOne({ _id: id, userId });

        if (!address) {
            return NextResponse.json(
                { success: false, message: "Address not found" },
                { status: 404 }
            );
        }

        // If this is set as default, unset other default addresses
        if (isDefault && !address.isDefault) {
            await Address.updateMany(
                { userId, isDefault: true, _id: { $ne: id } },
                { $set: { isDefault: false } }
            );
        }

        // Update the address
        address.fullName = fullName;
        address.phoneNumber = phoneNumber;
        address.pincode = Number(pincode);
        address.area = area;
        address.city = city;
        address.state = state;
        address.isDefault = isDefault || false;

        await address.save();

        return NextResponse.json({
            success: true,
            message: "Address updated successfully",
            address
        });

    } catch (error) {
        console.error("Error updating address:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update address", error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete address
export async function DELETE(req, { params }) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const { id } = await params;

        // Verify the address belongs to the user and delete
        const result = await Address.findOneAndDelete({ _id: id, userId });

        if (!result) {
            return NextResponse.json(
                { success: false, message: "Address not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Address deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting address:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete address", error: error.message },
            { status: 500 }
        );
    }
}

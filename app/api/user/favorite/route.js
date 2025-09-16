import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { productId, action } = await request.json(); // action: 'add' or 'remove'
        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" });
        }
        if (action === "add") {
            if (!user.favorites.includes(productId)) {
                user.favorites.push(productId);
            }
        } else if (action === "remove") {
            user.favorites = user.favorites.filter(id => id !== productId);
        }
        await user.save();
        return NextResponse.json({ success: true, favorites: user.favorites });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" });
        }
        return NextResponse.json({ success: true, favorites: user.favorites });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

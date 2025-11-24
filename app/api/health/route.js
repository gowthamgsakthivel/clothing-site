import { NextResponse } from "next/server";

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            message: "Server is healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Health check failed",
            error: error.message
        }, { status: 500 });
    }
}
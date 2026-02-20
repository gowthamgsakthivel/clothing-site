import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authRoles";

export async function POST(request) {
    await requireAdmin();

    return NextResponse.json({
        success: false,
        message: "This endpoint is deprecated. Use v2 APIs."
    }, { status: 410 });
}

export async function GET(request) {
    await requireAdmin();

    return NextResponse.json({
        success: false,
        message: "This endpoint is deprecated. Use v2 APIs."
    }, { status: 410 });
}
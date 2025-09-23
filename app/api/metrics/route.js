import { getApiMetrics } from "@/lib/apiMonitoring";
import { NextResponse } from "next/server";

export async function GET(request) {
    // Simple security check (should use proper auth in production)
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.METRICS_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({
        metrics: getApiMetrics(),
        timestamp: new Date().toISOString()
    });
}

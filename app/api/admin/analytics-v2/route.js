import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { getAnalyticsSummary } from '@/services/analytics/AnalyticsService';

export async function GET() {
  try {
    await requireAdmin();

    const result = await getAnalyticsSummary();

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const normalized = buildError(error);
    return NextResponse.json({
      success: false,
      message: normalized.message
    }, { status: normalized.status || 500 });
  }
}

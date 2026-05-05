import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Review from '@/models/Review';
import { requireAdmin } from '@/lib/authRoles';

export async function GET(req) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const skip = (page - 1) * limit;
    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, reviews, total, page, limit });
  } catch (err) {
    console.error('Admin fetch reviews error', err);
    const status = err.status || 500;
    return NextResponse.json({ success: false, message: err.message }, { status });
  }
}

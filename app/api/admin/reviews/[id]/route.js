import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Review from '@/models/Review';
import { requireAdmin } from '@/lib/authRoles';
import { refreshProductRatingStats } from '@/lib/reviewRatings';

export async function DELETE(req, { params }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    const result = await Review.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    // refresh product stats
    try { await refreshProductRatingStats(result.productId); } catch (e) { console.warn('Failed to refresh rating stats', e); }

    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('Admin delete review error', err);
    const status = err.status || 500;
    return NextResponse.json({ success: false, message: err.message }, { status });
  }
}

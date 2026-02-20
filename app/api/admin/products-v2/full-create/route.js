import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { createFullProduct } from '@/services/products/ProductCreationService';

export async function POST(request) {
  try {
    const { userId } = await requireAdmin();
    const payload = await request.json();

    const result = await createFullProduct({
      payload: {
        ...payload,
        product: {
          ...(payload?.product || {}),
          status: payload?.product?.status || 'active'
        }
      },
      actorId: userId
    });

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 });
  } catch (error) {
    const normalized = buildError(error);
    return NextResponse.json({
      success: false,
      message: normalized.message
    }, { status: normalized.status || 500 });
  }
}

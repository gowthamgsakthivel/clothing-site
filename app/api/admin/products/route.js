import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import {
  createProduct,
  getProductsWithPagination
} from '@/services/products/ProductService';

export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const result = await getProductsWithPagination({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      includeVariants: searchParams.get('includeVariants') === 'true',
      sort: 'createdAt',
      order: searchParams.get('order') || 'desc'
    });

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

export async function POST(request) {
  try {
    const { userId } = await requireAdmin();
    const payload = await request.json();

    const result = await createProduct({
      payload: {
        ...payload,
        status: payload?.status || 'active'
      },
      createdBy: userId
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

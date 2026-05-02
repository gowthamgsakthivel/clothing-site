import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { bulkUpdateStock, listInventory } from '@/services/inventory/InventoryService.server';

export async function GET(request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const result = await listInventory({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      lowStockOnly: searchParams.get('lowStock') === 'true',
      sku: searchParams.get('sku') || undefined,
      productId: searchParams.get('productId') || undefined,
      productSearch: searchParams.get('product') || undefined
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

export async function PATCH(request) {
  try {
    const { userId } = await requireAdmin();
    const payload = await request.json();

    const result = await bulkUpdateStock({
      updates: payload?.updates || [],
      actorId: userId,
      reference: 'admin_bulk'
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

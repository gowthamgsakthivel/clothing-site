import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { shipOrder } from '@/services/orders/OrderService';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export async function PATCH(_request, { params }) {
  try {
    await requireAdmin();

    const { id } = params || {};
    if (!isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order id' }, { status: 400 });
    }

    const result = await shipOrder(id);

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

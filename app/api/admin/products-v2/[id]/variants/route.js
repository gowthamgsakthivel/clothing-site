import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { createVariant, getVariantsByProduct } from '@/services/products/VariantService';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export async function GET(_request, { params }) {
  try {
    await requireAdmin();

    const { id } = params || {};
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product id'
      }, { status: 400 });
    }

    const result = await getVariantsByProduct(id);

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

export async function POST(request, { params }) {
  try {
    await requireAdmin();

    const { id } = params || {};
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product id'
      }, { status: 400 });
    }

    const payload = await request.json();
    const result = await createVariant(id, payload);

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

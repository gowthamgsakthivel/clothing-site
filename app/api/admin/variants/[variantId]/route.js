import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { deleteVariant, updateVariant } from '@/services/products/VariantService';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export async function PUT(request, { params }) {
  try {
    await requireAdmin();

    const { variantId } = params || {};
    if (!isValidObjectId(variantId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid variant id'
      }, { status: 400 });
    }

    const payload = await request.json();
    const result = await updateVariant(variantId, payload);

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

export async function PATCH(request, { params }) {
  return PUT(request, { params });
}

export async function DELETE(_request, { params }) {
  try {
    await requireAdmin();

    const { variantId } = params || {};
    if (!isValidObjectId(variantId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid variant id'
      }, { status: 400 });
    }

    const result = await deleteVariant(variantId);

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

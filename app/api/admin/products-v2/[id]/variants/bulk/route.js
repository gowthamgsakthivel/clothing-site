import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { createVariantsForProduct } from '@/services/products/ProductCreationService';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export async function POST(request, { params }) {
  try {
    const { userId } = await requireAdmin();

    const { id } = params || {};
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product id'
      }, { status: 400 });
    }

    const payload = await request.json();
    const variants = payload?.variants || [];

    const result = await createVariantsForProduct({
      productId: id,
      variants,
      actorId: userId,
      reference: 'variant_bulk'
    });

    return NextResponse.json({
      success: true,
      data: { createdCount: result.createdCount }
    }, { status: 201 });
  } catch (error) {
    const normalized = buildError(error);
    return NextResponse.json({
      success: false,
      message: normalized.message
    }, { status: normalized.status || 500 });
  }
}

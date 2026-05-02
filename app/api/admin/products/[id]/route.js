import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import {
  deleteProduct,
  getProductById,
  updateProduct
} from '@/services/products/ProductService';

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

    const result = await getProductById({ productId: id });

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

export async function PUT(request, { params }) {
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
    const result = await updateProduct({ productId: id, payload, actorId: userId });

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
    const result = await updateProduct({ productId: id, payload, actorId: userId });

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

export async function DELETE(_request, { params }) {
  try {
    const { userId } = await requireAdmin();

    const { id } = params || {};
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product id'
      }, { status: 400 });
    }

    const result = await deleteProduct({ productId: id, actorId: userId });

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

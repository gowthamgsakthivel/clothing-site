import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import { buildError } from '@/lib/errors';
import { retryShiprocketSync } from '@/services/shipments/ShipmentService';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export async function POST(request) {
  try {
    await requireAdmin();

    const payload = await request.json();
    const shipmentId = payload?.shipmentId;

    if (!shipmentId || !isValidObjectId(shipmentId)) {
      return NextResponse.json({ success: false, message: 'Invalid shipment id' }, { status: 400 });
    }

    const result = await retryShiprocketSync(shipmentId);

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

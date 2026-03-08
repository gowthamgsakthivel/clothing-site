import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import Shipment from '@/models/v2/Shipment';
import { generateLabel } from '@/services/shiprocket/ShiprocketService';

export async function POST(request, context) {
    try {
        await requireAdmin();
        await connectDB();

        const params = await context.params;
        const shipmentId = params.shipmentId;
        if (!shipmentId) {
            return NextResponse.json({ success: false, message: 'Shipment ID is required' }, { status: 400 });
        }

        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            return NextResponse.json({ success: false, message: 'Shipment not found' }, { status: 404 });
        }

        if (!shipment.shiprocketShipmentId) {
            return NextResponse.json({ success: false, message: 'No Shiprocket shipment associated' }, { status: 400 });
        }

        const labelResult = await generateLabel({ shipmentId: shipment.shiprocketShipmentId });
        console.log('Shiprocket Label Response:', JSON.stringify(labelResult.data, null, 2));

        if (!labelResult.success) {
            return NextResponse.json({ success: false, message: labelResult.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            labelUrl: labelResult.data?.label_url || null,
            _debug_response: labelResult.data
        });
    } catch (error) {
        console.error('generate label error', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
    }
}

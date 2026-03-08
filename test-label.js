import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Shipment from './models/v2/Shipment.js';
import { generateLabel } from './services/shiprocket/ShiprocketService.js';

async function testLabel() {
    await connectDB();

    // Find a shipment with a shiprocket shipment ID
    const shipment = await Shipment.findOne({ shiprocketShipmentId: { $exists: true, $ne: null } }).lean();

    if (!shipment) {
        console.log('No shipment with Shiprocket ID found.');
        process.exit(0);
    }

    console.log('Found Shipment:', shipment._id);
    console.log('Shiprocket Shipment ID:', shipment.shiprocketShipmentId);

    const result = await generateLabel({ shipmentId: shipment.shiprocketShipmentId });

    console.log('Label Generation Result:', JSON.stringify(result, null, 2));
    process.exit(0);
}

testLabel().catch(console.error);

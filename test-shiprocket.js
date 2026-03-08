import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    const shipments = await mongoose.connection.collection('shipments').find({ shiprocketShipmentId: { $ne: null } }).limit(1).toArray();

    if (!shipments.length) {
        console.log("No shipment found.");
        process.exit(0);
    }

    const shiprocketId = shipments[0].shiprocketShipmentId;
    console.log("Using Shiprocket ID:", shiprocketId);

    const authRes = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
    });
    const token = authRes.data.token;

    try {
        const labelRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
            shipment_id: [shiprocketId]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Success:", JSON.stringify(labelRes.data, null, 2));
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }

    process.exit(0);
}

test();

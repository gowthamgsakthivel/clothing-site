import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import User from '@/models/User';
import OrderV2 from '@/models/v2/Order';
import Shipment from '@/models/v2/Shipment';
import ProductV2 from '@/models/v2/Product';
import Contact from '@/models/Contact';

export async function GET(request) {
    try {
        await requireAdmin();

        await connectDB();

        // Fetch all statistics
        const [
            totalUsers,
            totalOrders,
            totalProducts,
            totalContacts,
            recentOrders,
            totalRevenueAgg,
            ordersByStatusAgg,
            rtoCount,
            failedCount
        ] = await Promise.all([
            User.countDocuments(),
            OrderV2.countDocuments(),
            ProductV2.countDocuments({ status: 'active' }),
            Contact.countDocuments(),
            OrderV2.find().sort({ createdAt: -1 }).limit(10).lean(),
            OrderV2.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$grandTotal' } } }
            ]),
            OrderV2.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Shipment.countDocuments({ externalStatus: 'rto' }),
            Shipment.countDocuments({ externalStatus: 'failed' })
        ]);

        const totalRevenue = Math.round(totalRevenueAgg?.[0]?.total || 0);

        const ordersByStatus = {
            placed: 0,
            packed: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            rto: rtoCount || 0,
            failed: failedCount || 0
        };

        ordersByStatusAgg.forEach((entry) => {
            const key = entry?._id;
            if (key && ordersByStatus[key] !== undefined) {
                ordersByStatus[key] = entry.count;
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                totalUsers,
                totalOrders,
                totalRevenue,
                totalProducts,
                totalContacts,
                recentOrders: recentOrders.map(order => ({
                    _id: order._id,
                    userId: order.userId,
                    amount: order.grandTotal,
                    status: order.status,
                    date: order.createdAt ? Math.floor(new Date(order.createdAt).getTime() / 1000) : null
                })),
                ordersByStatus,
            }
        });
    } catch (error) {
        const status = error.status || 500;
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Failed to fetch admin statistics'
        }, { status });
    }
}

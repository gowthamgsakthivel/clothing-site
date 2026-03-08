import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authRoles';
import connectDB from '@/config/db';
import User from '@/models/User';
import OrderV2 from '@/models/v2/Order';
import Shipment from '@/models/v2/Shipment';
import ProductV2 from '@/models/v2/Product';
import Contact from '@/models/Contact';
import Inventory from '@/models/v2/Inventory';
import ProductVariant from '@/models/v2/ProductVariant';

export async function GET(request) {
    try {
        await requireAdmin();
        await connectDB();

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const [
            totalUsers,
            totalOrders,
            totalProducts,
            totalContacts,
            recentOrders,
            totalRevenueAgg,
            ordersByStatusAgg,
            rtoCount,
            failedCount,
            currentPeriodRevenue,
            previousPeriodRevenue,
            currentPeriodOrders,
            previousPeriodOrders,
            chartDataAgg,
            lowStockItems
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
            OrderV2.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Shipment.countDocuments({ externalStatus: 'rto' }),
            Shipment.countDocuments({ externalStatus: 'failed' }),

            OrderV2.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$grandTotal' } } }
            ]),
            OrderV2.aggregate([
                { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$grandTotal' } } }
            ]),
            OrderV2.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            OrderV2.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),

            OrderV2.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        dailyRevenue: { $sum: '$grandTotal' },
                        dailyOrders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            Inventory.find({ $expr: { $lte: ["$totalStock", "$lowStockThreshold"] } })
                .populate({
                    path: 'variantId',
                    populate: { path: 'productId', select: 'name images _id' },
                })
                .limit(5)
                .lean()
        ]);

        const totalRevenue = Math.round(totalRevenueAgg?.[0]?.total || 0);

        const ordersByStatus = {
            placed: 0, packed: 0, shipped: 0, delivered: 0,
            cancelled: 0, rto: rtoCount || 0, failed: failedCount || 0
        };

        ordersByStatusAgg.forEach((entry) => {
            const key = entry?._id;
            if (key && ordersByStatus[key] !== undefined) ordersByStatus[key] = entry.count;
        });

        const currRev = currentPeriodRevenue?.[0]?.total || 0;
        const prevRev = previousPeriodRevenue?.[0]?.total || 0;
        const revenueTrend = prevRev === 0 ? 100 : Math.round(((currRev - prevRev) / prevRev) * 100);

        const ordersTrend = previousPeriodOrders === 0 ? 100 : Math.round(((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100);

        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = d.toISOString().split('T')[0];
            const found = chartDataAgg.find(item => item._id === dateStr);
            chartData.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: found ? found.dailyRevenue : 0,
                orders: found ? found.dailyOrders : 0
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                totalUsers,
                totalOrders,
                totalRevenue,
                totalProducts,
                totalContacts,
                trends: {
                    revenue: revenueTrend,
                    orders: ordersTrend
                },
                chartData,
                lowStockItems: lowStockItems.map(item => ({
                    _id: item._id,
                    sku: item.sku,
                    stock: item.totalStock,
                    threshold: item.lowStockThreshold,
                    variant: {
                        color: item.variantId?.color,
                        size: item.variantId?.size,
                        productId: item.variantId?.productId?._id,
                        productName: item.variantId?.productId?.name,
                    }
                })),
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

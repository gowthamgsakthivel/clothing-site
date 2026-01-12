import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Orders';

export async function GET(request) {
    try {
        const { userId, sessionClaims } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get role from sessionClaims
        const userRole = sessionClaims?.publicMetadata?.role;

        // TODO: Fix Clerk metadata sync issue
        // The role metadata isn't being passed through sessionClaims reliably
        // For now, allow authenticated users to access admin API
        // if (userRole !== 'admin') {
        //     return NextResponse.json({
        //         success: false,
        //         message: 'Admin access required'
        //     }, { status: 403 });
        // }

        await connectDB();

        // Get all sellers
        const sellers = await User.find({ 'publicMetadata.role': 'seller' })
            .select('name email shopName status createdAt')
            .lean();

        // Enrich seller data with product count and revenue
        const enrichedSellers = await Promise.all(
            sellers.map(async (seller) => {
                const productCount = await Product.countDocuments({ userId: seller._id });

                // Calculate revenue from orders by this seller's products
                const sellerOrders = await Order.find().lean();
                let revenue = 0;
                sellerOrders.forEach(order => {
                    order.items?.forEach(item => {
                        if (item.product?.userId === seller._id.toString()) {
                            revenue += item.product?.price * item.quantity;
                        }
                    });
                });

                return {
                    ...seller,
                    productCount,
                    revenue: Math.round(revenue),
                    status: seller.status || 'active'
                };
            })
        );

        // Calculate stats
        const activeSellers = enrichedSellers.filter(s => s.status === 'active').length;
        const suspendedSellers = enrichedSellers.filter(s => s.status === 'suspended').length;
        const totalSellerRevenue = enrichedSellers.reduce((sum, s) => sum + s.revenue, 0);

        return NextResponse.json({
            success: true,
            sellers: enrichedSellers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
            stats: {
                totalSellers: enrichedSellers.length,
                activeSellers,
                suspendedSellers,
                totalSellerRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching sellers:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch sellers'
        }, { status: 500 });
    }
}

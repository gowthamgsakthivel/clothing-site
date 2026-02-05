import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Order from "@/models/Orders";
import CustomDesign from "@/models/CustomDesign";

export async function GET(request) {
    //console.log("⭐ Starting seller overview analytics API route");
    try {
        // Authenticate seller
        let userId;
        try {
            const auth = getAuth(request);
            userId = auth.userId;
            //console.log("👤 Seller auth result:", { userId: userId || "undefined" });
        } catch (authError) {
            console.error("❌ Error with authentication:", authError);
            return NextResponse.json({
                success: false,
                message: 'Authentication error: ' + authError.message
            }, { status: 401 });
        }

        if (!userId) {
            //console.log("❌ No userId found in auth");
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        //console.log("🛡️ Checking if user is a seller");
        try {
            const isSeller = await authSeller(userId);
            if (!isSeller) {
                //console.log("❌ User is not authorized as seller");
                return NextResponse.json({
                    success: false,
                    message: 'Not authorized as seller'
                }, { status: 403 });
            }
            //console.log("✅ User is confirmed as seller");
        } catch (authError) {
            console.error("❌ Error checking seller status:", authError);
            return NextResponse.json({
                success: false,
                message: 'Error checking seller status: ' + authError.message
            }, { status: 500 });
        }

        // Connect to database
        //console.log("🔌 Connecting to database...");
        try {
            await connectDB();
            //console.log("✅ Connected to database");
        } catch (dbError) {
            console.error("❌ Database connection failed:", dbError);
            return NextResponse.json({
                success: false,
                message: 'Database connection failed: ' + dbError.message
            }, { status: 500 });
        }

        // Get query parameters for time frame
        const { searchParams } = new URL(request.url);
        const timeFrame = searchParams.get('timeFrame') || 'all'; // all, last7days, last30days, last90days
        const fromISO = searchParams.get('from');
        const toISO = searchParams.get('to');

        // Build date filter if needed (UTC normalized)
        let dateFilter = {};
        let orderDateFilter = {};

        //console.log(`Building time frame filters for: ${timeFrame}`);

        const buildUtcRange = (fromDate, toDate) => {
            const from = new Date(fromDate);
            const to = new Date(toDate);

            if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
                return null;
            }

            from.setUTCHours(0, 0, 0, 0);
            to.setUTCHours(23, 59, 59, 999);

            return { from, to };
        };

        let range = null;

        if (fromISO && toISO) {
            range = buildUtcRange(fromISO, toISO);
            //console.log("Using explicit UTC range:", { fromISO, toISO, valid: !!range });
        }

        if (!range && timeFrame !== 'all') {
            const now = new Date();
            const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            let from = new Date(todayUtc);

            if (timeFrame === 'last7days') {
                from.setUTCDate(from.getUTCDate() - 7);
            } else if (timeFrame === 'last30days') {
                from.setUTCDate(from.getUTCDate() - 30);
            } else if (timeFrame === 'last90days') {
                from.setUTCDate(from.getUTCDate() - 90);
            }

            const to = new Date(todayUtc);
            to.setUTCDate(to.getUTCDate());
            to.setUTCHours(23, 59, 59, 999);

            range = { from, to };
            //console.log("Using timeFrame UTC range:", { timeFrame, from, to });
        }

        if (range) {
            dateFilter = { createdAt: { $gte: range.from, $lte: range.to } };
            const fromTimestamp = Math.floor(range.from.getTime() / 1000);
            const toTimestamp = Math.floor(range.to.getTime() / 1000);
            orderDateFilter = { date: { $gte: fromTimestamp, $lte: toTimestamp } };
        }

        //console.log("⏰ Time frame filter:", timeFrame, "range:", range || "all-time");

        // Collect analytics data
        let analyticsData = {};

        try {
            // 1. Regular Orders Analytics
            const totalRegularOrders = await Order.countDocuments(orderDateFilter);

            const orderStatusCounts = await Order.aggregate([
                { $match: orderDateFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            const orderStatusMap = {};
            orderStatusCounts.forEach(item => {
                orderStatusMap[item._id] = item.count;
            });

            // Revenue from regular orders
            const regularOrdersRevenue = await Order.aggregate([
                { $match: orderDateFilter },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amount" },
                        averageOrderValue: { $avg: "$amount" },
                        minOrderValue: { $min: "$amount" },
                        maxOrderValue: { $max: "$amount" }
                    }
                }
            ]);

            // Monthly orders trend
            const now = new Date();
            const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
            const sixMonthsAgoTimestamp = Math.floor(sixMonthsAgo.getTime() / 1000);

            let orderMonthlyTrends = [];

            // Create monthly buckets for the past 6 months as a fallback
            const fallbackMonthlyTrends = [];
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setUTCMonth(d.getUTCMonth() - i);
                fallbackMonthlyTrends.push({
                    _id: { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 },
                    count: 0,
                    revenue: 0
                });
            }

            try {
                // We'll get all orders from the past 6 months and process them in JavaScript
                // This avoids MongoDB aggregation issues with date conversions
                const recentOrders = await Order.find({
                    date: { $gte: sixMonthsAgoTimestamp }
                }).select('date amount').lean();

                //console.log(`Found ${recentOrders.length} recent orders`);

                // Group by year/month in JavaScript
                const monthlyData = {};

                recentOrders.forEach(order => {
                    try {
                        // Convert timestamp to date, safely handling potentially invalid values
                        let orderDate;
                        if (typeof order.date === 'number') {
                            // If it's a Unix timestamp, check if it needs conversion
                            // If the timestamp is very large (>100000000000), it's likely milliseconds instead of seconds
                            const timestamp = order.date > 100000000000 ?
                                Math.floor(order.date / 1000) : // Convert to seconds if it's in milliseconds
                                order.date; // Use as is if it's already in seconds

                            orderDate = new Date(timestamp * 1000); // Convert seconds to milliseconds

                            // Double check for invalid years (from incorrect timestamp format)
                            const year = orderDate.getFullYear();
                            if (year < 2000 || year > 2100) {
                                // Try alternate interpretation as direct milliseconds
                                const altOrderDate = new Date(order.date);
                                const altYear = altOrderDate.getFullYear();
                                if (altYear >= 2000 && altYear <= 2100) {
                                    // This format works better
                                    orderDate = altOrderDate;
                                }
                            }
                        } else if (order.date instanceof Date) {
                            // If it's already a Date object
                            orderDate = order.date;
                        } else {
                            // Fallback to current date
                            console.error("Invalid date format:", order.date);
                            orderDate = new Date();
                        }

                        // Validate the date and fix if invalid
                        const currentYear = new Date().getFullYear();
                        if (orderDate.getFullYear() < 2000 || orderDate.getFullYear() > currentYear + 1) {
                            console.error("Invalid year detected:", orderDate.getFullYear(), "for order:", order._id);
                            orderDate = new Date(); // Fallback to current date
                        }

                        const year = orderDate.getUTCFullYear();
                        const month = orderDate.getUTCMonth() + 1; // JavaScript months are 0-indexed

                        const key = `${year}-${month}`;

                        if (!monthlyData[key]) {
                            monthlyData[key] = {
                                _id: { year, month },
                                count: 0,
                                revenue: 0
                            };
                        }

                        monthlyData[key].count++;
                        monthlyData[key].revenue += order.amount || 0;
                    } catch (error) {
                        console.error("Error processing order:", error);
                    }
                });

                // Convert to array
                orderMonthlyTrends = Object.values(monthlyData);

                // Sort by year and month
                orderMonthlyTrends.sort((a, b) => {
                    if (a._id.year !== b._id.year) return a._id.year - b._id.year;
                    return a._id.month - b._id.month;
                });

                // If we got no data, use the fallback
                if (orderMonthlyTrends.length === 0) {
                    orderMonthlyTrends = fallbackMonthlyTrends;
                }

            } catch (trendError) {
                console.error("Error getting order monthly trends:", trendError);
                // Use fallback data
                orderMonthlyTrends = fallbackMonthlyTrends;
            }

            // 2. Custom Design Analytics
            const totalCustomDesigns = await CustomDesign.countDocuments(dateFilter);

            const designStatusCounts = await CustomDesign.aggregate([
                { $match: dateFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            const designStatusMap = {};
            designStatusCounts.forEach(item => {
                designStatusMap[item._id] = item.count;
            });

            // Quote stats
            const quoteStats = await CustomDesign.aggregate([
                { $match: { ...dateFilter, "quote.amount": { $exists: true, $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        totalQuoted: { $sum: 1 },
                        averageQuote: { $avg: "$quote.amount" },
                        maxQuote: { $max: "$quote.amount" },
                        minQuote: { $min: "$quote.amount" },
                        totalQuoteValue: { $sum: "$quote.amount" }
                    }
                }
            ]);

            // Custom design monthly trends
            let designMonthlyTrends = [];

            // Create monthly buckets for the past 6 months as a fallback
            const fallbackDesignTrends = [];
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                fallbackDesignTrends.push({
                    _id: { year: d.getFullYear(), month: d.getMonth() + 1 },
                    count: 0,
                    revenue: 0
                });
            }

            try {
                // Get all custom designs from the past 6 months and process them in JavaScript
                const recentDesigns = await CustomDesign.find({
                    createdAt: { $gte: sixMonthsAgo }
                }).select('createdAt quote.amount').lean();

                //console.log(`Found ${recentDesigns.length} recent custom designs`);

                // Group by year/month in JavaScript
                const monthlyData = {};

                recentDesigns.forEach(design => {
                    try {
                        // Get date from the createdAt field
                        const designDate = new Date(design.createdAt);
                        const year = designDate.getFullYear();
                        const month = designDate.getMonth() + 1; // JavaScript months are 0-indexed

                        const key = `${year}-${month}`;

                        if (!monthlyData[key]) {
                            monthlyData[key] = {
                                _id: { year, month },
                                count: 0,
                                revenue: 0
                            };
                        }

                        monthlyData[key].count++;

                        // Add quote amount if it exists and is greater than 0
                        const quoteAmount = design.quote && design.quote.amount > 0 ? design.quote.amount : 0;
                        monthlyData[key].revenue += quoteAmount;
                    } catch (error) {
                        console.error("Error processing design:", error);
                    }
                });

                // Convert to array
                designMonthlyTrends = Object.values(monthlyData);

                // Sort by year and month
                designMonthlyTrends.sort((a, b) => {
                    if (a._id.year !== b._id.year) return a._id.year - b._id.year;
                    return a._id.month - b._id.month;
                });

                // If we got no data, use the fallback
                if (designMonthlyTrends.length === 0) {
                    designMonthlyTrends = fallbackDesignTrends;
                }

            } catch (trendError) {
                console.error("Error getting design monthly trends:", trendError);
                // Use fallback data
                designMonthlyTrends = fallbackDesignTrends;
            }

            // 3. Combined Analytics 

            // Combine the monthly trends data
            const allMonthlyTrends = [];
            const monthMap = {};

            // Process regular order trends
            orderMonthlyTrends.forEach(item => {
                const key = `${item._id.year}-${item._id.month}`;
                monthMap[key] = {
                    year: item._id.year,
                    month: item._id.month,
                    regularOrders: item.count,
                    regularRevenue: item.revenue,
                    customDesigns: 0,
                    customRevenue: 0
                };
            });

            // Process custom design trends
            designMonthlyTrends.forEach(item => {
                const key = `${item._id.year}-${item._id.month}`;
                if (monthMap[key]) {
                    monthMap[key].customDesigns = item.count;
                    monthMap[key].customRevenue = item.revenue;
                } else {
                    monthMap[key] = {
                        year: item._id.year,
                        month: item._id.month,
                        regularOrders: 0,
                        regularRevenue: 0,
                        customDesigns: item.count,
                        customRevenue: item.revenue
                    };
                }
            });

            // Convert map to array and sort
            Object.keys(monthMap).forEach(key => {
                allMonthlyTrends.push(monthMap[key]);
            });

            allMonthlyTrends.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

            // Calculate total revenue
            const totalRegularRevenue = regularOrdersRevenue.length > 0 ? regularOrdersRevenue[0].totalRevenue : 0;
            const totalCustomRevenue = quoteStats.length > 0 ? quoteStats[0].totalQuoteValue : 0;
            const totalRevenue = totalRegularRevenue + totalCustomRevenue;

            // Total orders and designs
            const totalOrders = totalRegularOrders + totalCustomDesigns;

            // Build the response
            analyticsData = {
                summary: {
                    totalOrders,
                    totalRegularOrders,
                    totalCustomDesigns,
                    totalRevenue,
                    totalRegularRevenue,
                    totalCustomRevenue,
                    percentageRegular: totalOrders > 0 ? (totalRegularOrders / totalOrders) * 100 : 0,
                    percentageCustom: totalOrders > 0 ? (totalCustomDesigns / totalOrders) * 100 : 0
                },
                regularOrders: {
                    total: totalRegularOrders,
                    statusCounts: orderStatusMap,
                    revenue: regularOrdersRevenue.length > 0 ? {
                        total: regularOrdersRevenue[0].totalRevenue,
                        average: regularOrdersRevenue[0].averageOrderValue,
                        min: regularOrdersRevenue[0].minOrderValue,
                        max: regularOrdersRevenue[0].maxOrderValue
                    } : {
                        total: 0,
                        average: 0,
                        min: 0,
                        max: 0
                    }
                },
                customDesigns: {
                    total: totalCustomDesigns,
                    statusCounts: designStatusMap,
                    quoteStats: quoteStats.length > 0 ? {
                        totalQuoted: quoteStats[0].totalQuoted,
                        averageQuote: quoteStats[0].averageQuote,
                        maxQuote: quoteStats[0].maxQuote,
                        minQuote: quoteStats[0].minQuote,
                        totalQuoteValue: quoteStats[0].totalQuoteValue
                    } : {
                        totalQuoted: 0,
                        averageQuote: 0,
                        maxQuote: 0,
                        minQuote: 0,
                        totalQuoteValue: 0
                    }
                },
                trends: {
                    monthly: allMonthlyTrends
                }
            };

        } catch (analyticsError) {
            console.error("❌ Error calculating analytics:", analyticsError);
            return NextResponse.json({
                success: false,
                message: 'Error calculating analytics: ' + analyticsError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            analytics: analyticsData,
            timeFrame
        });

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}
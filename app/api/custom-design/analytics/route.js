import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import CustomDesign from "@/models/CustomDesign";
import connectDB from "@/config/db";
import mongoose from "mongoose";

export async function GET(request) {
    //console.log("⭐ Starting custom design analytics API route");
    try {
        // Authenticate seller
        const { userId } = getAuth(request);
        //console.log("👤 Seller auth result:", { userId: userId || "undefined" });

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
        }

        //console.log("⏰ Time frame filter:", timeFrame, "range:", range || "all-time");

        // Collect analytics data
        let analyticsData = {};

        try {
            // 1. Total number of design requests
            analyticsData.totalRequests = await CustomDesign.countDocuments(dateFilter);
            //console.log("📊 Total requests:", analyticsData.totalRequests);

            // 2. Count by status
            const statusCounts = await CustomDesign.aggregate([
                { $match: dateFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            analyticsData.statusCounts = {
                pending: 0,
                quoted: 0,
                approved: 0,
                rejected: 0,
                completed: 0
            };

            statusCounts.forEach(item => {
                if (analyticsData.statusCounts.hasOwnProperty(item._id)) {
                    analyticsData.statusCounts[item._id] = item.count;
                }
            });

            //console.log("📊 Status counts:", analyticsData.statusCounts);

            // 3. Average quote amount
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

            analyticsData.quoteStats = quoteStats.length > 0 ? {
                totalQuoted: quoteStats[0].totalQuoted,
                averageQuote: Math.round(quoteStats[0].averageQuote * 100) / 100,
                maxQuote: quoteStats[0].maxQuote,
                minQuote: quoteStats[0].minQuote,
                totalQuoteValue: quoteStats[0].totalQuoteValue
            } : {
                totalQuoted: 0,
                averageQuote: 0,
                maxQuote: 0,
                minQuote: 0,
                totalQuoteValue: 0
            };

            //console.log("📊 Quote stats:", analyticsData.quoteStats);

            // 4. Count by size preference
            const sizeCounts = await CustomDesign.aggregate([
                { $match: dateFilter },
                { $group: { _id: "$size", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            analyticsData.sizeCounts = sizeCounts;
            //console.log("📊 Size counts:", analyticsData.sizeCounts.length);

            // 5. Monthly trends (last 6 months)
            const now = new Date();
            const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);

            const monthlyTrends = await CustomDesign.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sixMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        count: { $sum: 1 },
                        averageQuote: {
                            $avg: {
                                $cond: [
                                    { $gt: ["$quote.amount", 0] },
                                    "$quote.amount",
                                    null
                                ]
                            }
                        },
                    }
                },
                {
                    $project: {
                        _id: 0,
                        year: "$_id.year",
                        month: "$_id.month",
                        count: 1,
                        averageQuote: { $round: ["$averageQuote", 2] }
                    }
                },
                { $sort: { year: 1, month: 1 } }
            ]);

            analyticsData.monthlyTrends = monthlyTrends;
            //console.log("📊 Monthly trends:", analyticsData.monthlyTrends.length);

            // 6. Response time analysis
            const responseTimes = await CustomDesign.aggregate([
                {
                    $match: {
                        ...dateFilter,
                        status: { $in: ["quoted", "approved", "rejected", "completed"] }
                    }
                },
                {
                    $project: {
                        responseTime: {
                            $divide: [
                                { $subtract: ["$updatedAt", "$createdAt"] },
                                1000 * 60 * 60 // Convert to hours
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageResponseTime: { $avg: "$responseTime" },
                        maxResponseTime: { $max: "$responseTime" },
                        minResponseTime: { $min: "$responseTime" }
                    }
                }
            ]);

            analyticsData.responseTimes = responseTimes.length > 0 ? {
                averageResponseTime: Math.round(responseTimes[0].averageResponseTime * 10) / 10, // Round to 1 decimal
                maxResponseTime: Math.round(responseTimes[0].maxResponseTime * 10) / 10,
                minResponseTime: Math.round(responseTimes[0].minResponseTime * 10) / 10
            } : {
                averageResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: 0
            };

            //console.log("📊 Response times:", analyticsData.responseTimes);

            // 7. Conversion rates
            analyticsData.conversionRates = {
                quotedToApproved: analyticsData.statusCounts.quoted > 0
                    ? (analyticsData.statusCounts.approved / analyticsData.statusCounts.quoted) * 100
                    : 0,
                totalToCompleted: analyticsData.totalRequests > 0
                    ? (analyticsData.statusCounts.completed / analyticsData.totalRequests) * 100
                    : 0
            };

            // Round to 2 decimal places
            analyticsData.conversionRates.quotedToApproved = Math.round(analyticsData.conversionRates.quotedToApproved * 100) / 100;
            analyticsData.conversionRates.totalToCompleted = Math.round(analyticsData.conversionRates.totalToCompleted * 100) / 100;

            //console.log("📊 Conversion rates:", analyticsData.conversionRates);

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
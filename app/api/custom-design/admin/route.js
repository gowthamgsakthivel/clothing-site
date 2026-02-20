import { NextResponse } from "next/server";
import CustomDesign from "@/models/CustomDesign";
import User from "@/models/User";
import connectDB from "@/config/db";
import { requireAdmin } from "@/lib/authRoles";

export async function GET(request) {
    console.log("⭐ Starting admin custom design list API route");
    try {
        await requireAdmin();

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Build query
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        // Connect to database
        console.log("🔌 Connecting to database...");
        try {
            await connectDB();
            console.log("✅ Connected to database");
        } catch (dbError) {
            console.error("❌ Database connection failed:", dbError);
            return NextResponse.json({
                success: false,
                message: 'Database connection failed: ' + dbError.message,
                designRequests: [],
                pagination: {
                    page, limit, totalRequests: 0, totalPages: 0,
                    hasNextPage: false, hasPrevPage: false
                }
            }, { status: 500 });
        }

        const skip = (page - 1) * limit;

        // Get paginated design requests
        console.log("🔍 Finding design requests for page", page);
        let designRequests = [];
        try {
            designRequests = await CustomDesign.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Get user info separately since we can't use populate
            const userIds = [...new Set(designRequests.map(req => req.user))];
            const users = await User.find({ _id: { $in: userIds } }).lean();
            const userMap = {};
            users.forEach(user => {
                userMap[user._id] = { name: user.name, email: user.email };
            });

            // Add user info to design requests
            designRequests = designRequests.map(req => ({
                ...req,
                userInfo: userMap[req.user] || { name: 'Unknown', email: 'Unknown' }
            }));
        } catch (findError) {
            console.error("❌ Error finding design requests:", findError);
            return NextResponse.json({
                success: false,
                message: 'Error finding design requests: ' + findError.message,
                designRequests: [],
                pagination: {
                    page, limit, totalRequests: 0, totalPages: 0,
                    hasNextPage: false, hasPrevPage: false
                }
            }, { status: 500 });
        }

        // Count total requests for pagination
        let totalRequests = 0;
        try {
            totalRequests = await CustomDesign.countDocuments(query);
        } catch (countError) {
            console.error("❌ Error counting design requests:", countError);
        }

        // Pagination info
        const pagination = {
            page,
            limit,
            totalRequests,
            totalPages: Math.ceil(totalRequests / limit) || 1,
            hasNextPage: page < Math.ceil(totalRequests / limit),
            hasPrevPage: page > 1
        };

        return NextResponse.json({
            success: true,
            designRequests: designRequests || [],
            pagination
        });

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}

export async function POST(request) {
    console.log("⭐ Starting admin custom design POST API route");
    try {
        await requireAdmin();

        // Get request body
        const body = await request.json();
        const { designRequestId, action, message, amount } = body;

        if (!designRequestId) {
            return NextResponse.json({
                success: false,
                message: 'Design request ID is required'
            }, { status: 400 });
        }

        if (!action || !['quote', 'respond', 'update_status'].includes(action)) {
            return NextResponse.json({
                success: false,
                message: 'Valid action is required'
            }, { status: 400 });
        }

        // Connect to database
        console.log("🔌 Connecting to database...");
        try {
            await connectDB();
            console.log("✅ Connected to database");
        } catch (dbError) {
            console.error("❌ Database connection failed:", dbError);
            return NextResponse.json({
                success: false,
                message: 'Database connection failed: ' + dbError.message
            }, { status: 500 });
        }

        // Find the design request
        console.log("🔍 Finding design request with ID:", designRequestId);
        let designRequest;
        try {
            designRequest = await CustomDesign.findById(designRequestId);
        } catch (findError) {
            console.error("❌ Error finding design request:", findError);
            return NextResponse.json({
                success: false,
                message: 'Error finding design request: ' + findError.message
            }, { status: 500 });
        }

        if (!designRequest) {
            return NextResponse.json({
                success: false,
                message: 'Design request not found'
            }, { status: 404 });
        }

        // Process based on action
        if (action === 'quote') {
            if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                return NextResponse.json({
                    success: false,
                    message: 'Valid quote amount is required'
                }, { status: 400 });
            }

            designRequest.quote = {
                amount: Number(amount),
                message: message || '',
                timestamp: new Date()
            };
            designRequest.status = 'quoted';

            // Clear any previous customer response if we're re-quoting
            designRequest.customerResponse = undefined;

        } else if (action === 'respond') {
            if (!message) {
                return NextResponse.json({
                    success: false,
                    message: 'Response message is required'
                }, { status: 400 });
            }

            designRequest.adminResponse = {
                message,
                timestamp: new Date()
            };

            // If responding to a rejected quote with change request, change status back to quoted
            if (designRequest.status === 'rejected' && designRequest.customerResponse) {
                designRequest.status = 'quoted';
            }

        } else if (action === 'update_status') {
            if (!body.status || !['pending', 'quoted', 'approved', 'rejected', 'completed'].includes(body.status)) {
                return NextResponse.json({
                    success: false,
                    message: 'Valid status is required'
                }, { status: 400 });
            }

            designRequest.status = body.status;
        }

        // Update timestamp
        designRequest.updatedAt = new Date();

        // Save changes
        console.log("💾 Saving updated design request");
        try {
            await designRequest.save();
            console.log("✅ Design request updated successfully");
        } catch (saveError) {
            console.error("❌ Error saving design request:", saveError);
            return NextResponse.json({
                success: false,
                message: 'Error saving design request: ' + saveError.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Design request updated successfully',
            designRequest
        });

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}

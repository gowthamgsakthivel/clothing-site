import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import CustomDesign from "@/models/CustomDesign";
import User from "@/models/User";
import connectDB from "@/config/db";
import mongoose from "mongoose";

export async function GET(request) {
    // console.log("⭐ Starting custom design list API route");
    try {
        // Authenticate user
        const auth = getAuth(request);
        const { userId } = auth;

        // console.log("👤 Auth result:", { userId: userId || "undefined" });

        if (!userId) {
            // console.log("❌ No userId found in auth");
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Connect to the database with timeout
        console.log("🔌 Connecting to database...");
        try {
            // Set a timeout for database connection
            const dbTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database connection timeout')), 5000)
            );

            await Promise.race([connectDB(), dbTimeout]);
            console.log("✅ Connected to database");
        } catch (dbError) {
            console.error("❌ Database connection failed:", dbError);
            return NextResponse.json({
                success: false,
                message: 'Database connection failed: ' + dbError.message,
                designRequests: []
            }, { status: 500 });
        }

        // Get user using Clerk user ID as MongoDB _id
        // console.log("🔍 Finding user with ID:", userId);
        let user;
        try {
            user = await User.findById(userId);
        } catch (userError) {
            console.error("❌ Error finding user:", userError);
            return NextResponse.json({
                success: false,
                message: 'Error finding user: ' + userError.message
            }, { status: 500 });
        }

        if (!user) {
            // console.log("❌ User not found with ID:", userId);
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }
        // console.log("✅ Found user:", user.name);

        // Check if CustomDesign collection exists in the database
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            //console.log("Available collections:", collectionNames);

            // Check if customdesign collection exists (lowercase)
            const customDesignExists = collectionNames.includes('customdesigns');
            // console.log("CustomDesign collection exists:", customDesignExists);

            if (!customDesignExists) {
                // console.log("CustomDesign collection doesn't exist, returning empty array");
                return NextResponse.json({
                    success: true,
                    designRequests: []
                });
            }
        } catch (collError) {
            console.error("❌ Error checking collections:", collError);
            // Continue anyway, as this is just a diagnostic step
        }

        // Get custom design requests for this user
        //console.log("🔍 Finding design requests for user:", userId);
        let designRequests = [];
        try {
            // Verify the model exists and schema is correct
            //console.log("CustomDesign model exists:", !!CustomDesign);
            //console.log("CustomDesign schema paths:", Object.keys(CustomDesign.schema.paths));

            // Try the query with additional error handling
            designRequests = await CustomDesign.find({ user: userId })
                .sort({ createdAt: -1 })
                .lean()
                .maxTimeMS(10000); // 10 second timeout for the query

            //console.log(`✅ Found ${designRequests.length} design requests`);

            // Ensure designRequests is always an array
            if (!Array.isArray(designRequests)) {
                console.warn("⚠️ designRequests is not an array, converting...");
                designRequests = [];
            }

        } catch (designError) {
            console.error("❌ Error finding design requests:", designError);

            // If it's a timeout error, return partial success
            if (designError.name === 'MongooseError' && designError.message.includes('timeout')) {
                // console.log("Query timeout, returning empty array");
                designRequests = [];
            } else {
                // For other errors, return error response
                return NextResponse.json({
                    success: false,
                    message: 'Error finding design requests: ' + designError.message,
                    designRequests: []
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            designRequests: designRequests || []
        });

    } catch (error) {
        console.error("❌ Server error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            designRequests: []
        }, { status: 500 });
    }
}
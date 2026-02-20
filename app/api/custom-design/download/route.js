import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authRoles";
import CustomDesign from "@/models/CustomDesign";
import connectDB from "@/config/db";
import axios from "axios";

export async function GET(request) {
    // console.log("⭐ Starting download custom design image API route");
    try {
        await requireAdmin();

        // Get designId from query params
        const { searchParams } = new URL(request.url);
        const designId = searchParams.get('designId');

        if (!designId) {
            // console.log("❌ Missing designId parameter");
            return NextResponse.json({
                success: false,
                message: 'Design ID is required'
            }, { status: 400 });
        }

        // console.log("🔍 Looking up design with ID:", designId);

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
        let designRequest;
        try {
            designRequest = await CustomDesign.findById(designId);
        } catch (findError) {
            console.error("❌ Error finding design request:", findError);
            return NextResponse.json({
                success: false,
                message: 'Error finding design request: ' + findError.message
            }, { status: 500 });
        }

        if (!designRequest) {
            // console.log("❌ Design request not found with ID:", designId);
            return NextResponse.json({
                success: false,
                message: 'Design request not found'
            }, { status: 404 });
        }
        // console.log("✅ Found design request");

        // Get the image URL from the design request
        const imageUrl = designRequest.designImage;
        if (!imageUrl) {
            // console.log("❌ Design image URL not found");
            return NextResponse.json({
                success: false,
                message: 'Design image not found'
            }, { status: 404 });
        }

        // console.log("🖼️ Design image URL:", imageUrl);

        try {
            // Fetch the image
            // console.log("🔽 Fetching image from URL");
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                // Increase timeout for large images
                timeout: 15000
            });

            // Get the image type from Content-Type header or infer from URL
            const contentType = response.headers['content-type'] || inferContentTypeFromUrl(imageUrl);
            // console.log("📄 Content type:", contentType);

            // Create a sanitized name from the design name or customer name
            const sanitizedName = (designRequest.name || 'design')
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase()
                .substring(0, 30);  // Limit length

            // Create a file name based on the design name and ID
            const fileName = `design_${sanitizedName}_${designId.substring(0, 8)}.${getExtensionFromContentType(contentType)}`;

            // Return the image data with appropriate headers for download
            // console.log("📤 Sending image for download as:", fileName);
            return new NextResponse(response.data, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Content-Length': response.data.length.toString(),
                    'Cache-Control': 'no-store',  // Prevent caching sensitive images
                }
            });

        } catch (imgError) {
            console.error("❌ Error fetching design image:", imgError);
            return NextResponse.json({
                success: false,
                message: 'Error fetching design image: ' + imgError.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json({
            success: false,
            message: `Server error: ${error.message}`
        }, { status: 500 });
    }
}

// Helper function to infer content type from URL
function inferContentTypeFromUrl(url) {
    const extension = url.split('.').pop().toLowerCase();

    const contentTypeMap = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
    };

    return contentTypeMap[extension] || 'application/octet-stream';
}

// Helper function to get file extension from content type
function getExtensionFromContentType(contentType) {
    const extensionMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
    };

    return extensionMap[contentType] || 'jpg';
}
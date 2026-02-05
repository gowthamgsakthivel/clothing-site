import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import CustomDesign from "@/models/CustomDesign";
import User from "@/models/User";
import connectDB from "@/config/db";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate design request data
const validateDesignData = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
    }

    if (!data.email || !data.email.includes('@')) {
        errors.email = "Valid email is required";
    }

    if (!data.phone || data.phone.trim().length < 8) {
        errors.phone = "Valid phone number is required";
    }

    if (!data.description || data.description.trim().length < 10) {
        errors.description = "Description must be at least 10 characters";
    }

    if (!data.quantity || isNaN(Number(data.quantity)) || Number(data.quantity) < 1) {
        errors.quantity = "Valid quantity is required (minimum 1)";
    }

    if (!data.size || !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(data.size)) {
        errors.size = "Valid size is required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export async function POST(request) {
    try {
        // Authenticate user
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get user using Clerk user ID as MongoDB _id
        await connectDB();
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Parse form data
        let formData;
        try {
            formData = await request.formData();
            // console.log("Form data received:",
            //     [...formData.entries()].map(([key]) => key).join(', '));
        } catch (formError) {
            console.error("Error parsing form data:", formError);
            return NextResponse.json({
                success: false,
                message: `Error parsing form data: ${formError.message}`
            }, { status: 400 });
        }

        // Get the design image
        const designImage = formData.get('designImage');
        if (!designImage) {
            console.error("Design image missing from form data");
            return NextResponse.json({
                success: false,
                message: 'Design image is required'
            }, { status: 400 });
        }

        // console.log("Image received:", {
        //     name: designImage.name,
        //     type: designImage.type,
        //     size: designImage.size
        // });

        // Get design details
        const detailsJson = formData.get('details');
        if (!detailsJson) {
            console.error("Details missing from form data");
            return NextResponse.json({
                success: false,
                message: 'Design details are required'
            }, { status: 400 });
        }

        // Parse design details
        let details;
        try {
            details = JSON.parse(detailsJson);
            // console.log("Details parsed successfully:", Object.keys(details));

            // Additional logging to help diagnose issues
            // console.log("Design details content:", {
            //     name: details.name?.substring(0, 20) || "missing",
            //     email: details.email || "missing",
            //     phone: details.phone || "missing",
            //     description: details.description?.substring(0, 20) || "missing",
            //     quantity: details.quantity || "missing",
            //     size: details.size || "missing"
            // });
        } catch (parseError) {
            console.error("Error parsing details JSON:", parseError);
            console.error("Raw details value type:", typeof detailsJson);
            console.error("Raw details value (truncated):",
                detailsJson ? detailsJson.toString().substring(0, 100) + "..." : "null/undefined");

            return NextResponse.json({
                success: false,
                message: `Error parsing design details: ${parseError.message}. Please try again with valid information.`
            }, { status: 400 });
        }

        // Validate design details
        const validation = validateDesignData(details);
        if (!validation.isValid) {
            // console.log("❌ Design details validation failed:", validation.errors);
            return NextResponse.json({
                success: false,
                message: 'Validation failed: ' + Object.values(validation.errors).join(', '),
                errors: validation.errors
            }, { status: 400 });
        }

        // console.log("✅ Design details validation passed");

        // Upload design image to Cloudinary
        try {
            const arrayBuffer = await designImage.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'auto',
                        folder: 'sparrow-sports/custom-designs'
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(buffer);
            });

            // Create custom design request in database
            const newDesignRequest = await CustomDesign.create({
                user: userId, // Use the Clerk userId directly as the reference
                designImage: uploadResult.secure_url,
                name: details.name,
                email: details.email,
                phone: details.phone,
                description: details.description,
                quantity: Number(details.quantity),
                size: details.size,
                preferredColor: details.preferredColor || '',
                additionalNotes: details.additionalNotes || '',
                status: 'pending'
            });

            return NextResponse.json({
                success: true,
                message: 'Custom design request submitted successfully',
                designRequest: {
                    _id: newDesignRequest._id,
                    status: newDesignRequest.status,
                    createdAt: newDesignRequest.createdAt
                }
            }, { status: 201 });

        } catch (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json({
                success: false,
                message: `Error uploading design image: ${uploadError.message}`
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
import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import Product from "@/models/Product";
import connectDB from "@/config/db";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Server-side validation function
const validateProductData = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 3) {
        errors.name = "Product name must be at least 3 characters";
    }

    if (!data.description || data.description.trim().length < 20) {
        errors.description = "Description must be at least 20 characters";
    }

    if (!data.category) {
        errors.category = "Category is required";
    }

    if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
        errors.price = "Valid price is required";
    }

    if (!data.offerPrice || isNaN(Number(data.offerPrice)) || Number(data.offerPrice) <= 0) {
        errors.offerPrice = "Valid offer price is required";
    }

    if (Number(data.offerPrice) >= Number(data.price)) {
        errors.offerPrice = "Offer price must be less than regular price";
    }

    if (!data.brand || data.brand.trim().length === 0) {
        errors.brand = "Brand name is required";
    }

    if (!data.colors || data.colors.length === 0) {
        errors.colors = "At least one color is required";
    }

    if (!data.sizes || data.sizes.length === 0) {
        errors.sizes = "At least one size is required";
    }

    if (!data.stock || isNaN(Number(data.stock)) || Number(data.stock) < 0) {
        errors.stock = "Valid stock quantity is required";
    }

    if (!data.image || data.image.length === 0) {
        errors.image = "At least one image is required";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export async function POST(request) {
    try {
        // Authenticate seller
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({
                success: false,
                message: 'Not authorized as seller'
            }, { status: 403 });
        }

        // Parse form data
        const formData = await request.formData();

        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const genderCategory = formData.get('genderCategory');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');
        const brand = formData.get('brand');

        // Parse colors as array of objects
        let colors = formData.getAll('colors[]');
        if (colors && colors.length > 0) {
            colors = colors.map(c => {
                try {
                    return JSON.parse(c);
                } catch {
                    return null;
                }
            }).filter(Boolean);
        } else {
            colors = [];
        }

        const sizes = formData.getAll('sizes');
        const stock = formData.get('stock');
        const files = formData.getAll('images').filter(Boolean);

        // Validate files
        if (!files || files.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'At least one image is required'
            }, { status: 400 });
        }

        // Validate all data before processing
        const productData = {
            name,
            description,
            category,
            genderCategory,
            price,
            offerPrice,
            brand,
            colors,
            sizes,
            stock,
            image: files // Just for validation purposes
        };

        const validation = validateProductData(productData);
        if (!validation.isValid) {
            return NextResponse.json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            }, { status: 400 });
        }

        // Upload images to Cloudinary
        try {
            const result = await Promise.all(
                files.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            {
                                resource_type: 'auto',
                                folder: 'sparrow-sports' // Organize images in a folder
                            },
                            (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );
                        stream.end(buffer);
                    });
                })
            );

            const image = result.map(result => result.secure_url);

            // Connect to database and create product
            await connectDB();

            const newProduct = await Product.create({
                userId,
                name,
                description,
                category,
                genderCategory,
                price: Number(price),
                offerPrice: Number(offerPrice),
                image,
                brand,
                color: colors,
                sizes,
                stock: Number(stock),
                date: Math.floor(Date.now() / 1000) // Convert milliseconds to seconds for Unix timestamp
            });

            return NextResponse.json({
                success: true,
                message: "Product added successfully",
                product: newProduct
            }, { status: 201 });

        } catch (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json({
                success: false,
                message: `Error uploading images: ${uploadError.message}`
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
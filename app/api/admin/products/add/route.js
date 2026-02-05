import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    try {
        //console.log("⭐ Starting add product API route");

        // Authenticate user
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Connect to database
        await connectDB();

        // Check if user exists and is a seller
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Parse form data
        const formData = await request.formData();

        // Extract basic product data
        const name = formData.get('name');
        const description = formData.get('description');
        const price = parseFloat(formData.get('price'));
        const offerPrice = parseFloat(formData.get('offerPrice'));
        const category = formData.get('category');
        const genderCategory = formData.get('genderCategory');
        const brand = formData.get('brand');
        const totalStock = parseInt(formData.get('totalStock')) || 0;

        // Parse inventory and stock settings
        const inventory = JSON.parse(formData.get('inventory') || '[]');
        const stockSettings = JSON.parse(formData.get('stockSettings') || '{}');

        // Validation
        if (!name || !description || !price || !offerPrice || !category || !brand) {
            return NextResponse.json({
                success: false,
                message: 'All required fields must be filled'
            }, { status: 400 });
        }

        if (inventory.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'At least one color variant is required'
            }, { status: 400 });
        }

        // Upload images to Cloudinary
        const imageUrls = [];
        const imageCount = parseInt(formData.get('imageCount')) || 0;

        for (let i = 0; i < imageCount; i++) {
            const imageFile = formData.get(`image${i}`);
            if (imageFile) {
                try {
                    const bytes = await imageFile.arrayBuffer();
                    const buffer = Buffer.from(bytes);

                    // Upload to Cloudinary
                    const uploadResponse = await new Promise((resolve, reject) => {
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type: 'image',
                                folder: 'sparrow-sports/products',
                                transformation: [
                                    { width: 800, height: 800, crop: 'limit', quality: 'auto' }
                                ]
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        ).end(buffer);
                    });

                    imageUrls.push(uploadResponse.secure_url);
                } catch (uploadError) {
                    console.error("Image upload error:", uploadError);
                    return NextResponse.json({
                        success: false,
                        message: `Failed to upload image ${i + 1}`
                    }, { status: 500 });
                }
            }
        }

        if (imageUrls.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'At least one product image is required'
            }, { status: 400 });
        }

        // Calculate backward compatibility fields
        const backwardCompatibleColors = inventory.map(item => ({
            color: item.color.name,
            stock: item.sizeStock.reduce((total, size) => total + size.quantity, 0)
        }));

        const allSizes = [...new Set(inventory.flatMap(item =>
            item.sizeStock.filter(size => size.quantity > 0).map(size => size.size)
        ))];

        const availableColors = inventory
            .filter(item => item.sizeStock.some(size => size.quantity > 0))
            .map(item => item.color.name);

        const availableSizes = [...new Set(inventory.flatMap(item =>
            item.sizeStock.filter(size => size.quantity > 0).map(size => size.size)
        ))];

        // Create product
        const newProduct = new Product({
            userId,
            name,
            description,
            price,
            offerPrice,
            image: imageUrls,
            category,
            genderCategory,
            brand,
            inventory,
            stockSettings: {
                trackInventory: stockSettings.trackInventory ?? true,
                allowBackorders: stockSettings.allowBackorders ?? false,
                globalLowStockThreshold: stockSettings.globalLowStockThreshold ?? 10
            },
            // Backward compatibility fields
            color: backwardCompatibleColors,
            sizes: allSizes,
            stock: totalStock,
            totalStock,
            availableColors,
            availableSizes,
            date: Date.now()
        });

        await newProduct.save();

        //console.log("✅ Product added successfully with ID:", newProduct._id);

        return NextResponse.json({
            success: true,
            message: 'Product added successfully',
            product: {
                id: newProduct._id,
                name: newProduct.name,
                totalStock: newProduct.totalStock,
                colorVariants: newProduct.inventory.length
            }
        });

    } catch (error) {
        console.error("❌ Error adding product:", error);
        return NextResponse.json({
            success: false,
            message: 'Failed to add product: ' + error.message
        }, { status: 500 });
    }
}
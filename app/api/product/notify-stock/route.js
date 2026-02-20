import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import User from "@/models/User";
import ProductV2 from "@/models/v2/Product";
import ProductVariant from "@/models/v2/ProductVariant";

export async function POST(request) {
    try {
        await connectDB();
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Authentication required'
            }, { status: 401 });
        }

        // Get request body
        const { productId, color, size, productName, image, price } = await request.json();

        // Validate required fields
        if (!productId) {
            return NextResponse.json({
                success: false,
                message: 'Product ID is required'
            }, { status: 400 });
        }

        if (!color) {
            return NextResponse.json({
                success: false,
                message: 'Product color is required'
            }, { status: 400 });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Get product info if not provided
        let productInfo = { name: productName || '', image: image || null, price: price || 0 };

        if (!productName || !image || !price) {
            // Check if product exists
            const product = await ProductV2.findById(productId).lean();
            if (!product || product.status !== 'active') {
                return NextResponse.json({
                    success: false,
                    message: 'Product not found'
                }, { status: 404 });
            }

            const variantFilter = { productId: product._id, color };
            if (size) {
                variantFilter.size = size;
            }
            let variant = await ProductVariant.findOne(variantFilter).lean();
            if (!variant) {
                variant = await ProductVariant.findOne({ productId: product._id }).lean();
            }

            productInfo = {
                name: product.name,
                image: variant?.images && variant.images.length > 0 ? variant.images[0] : null,
                price: variant?.offerPrice || variant?.originalPrice || 0,
                brand: product.brand || '',
                category: product.category || '',
            };
        }

        // Check if notification already exists - handle the case where stockNotifications might not be initialized yet
        const stockNotifications = user.stockNotifications || [];

        const existingNotification = stockNotifications.find(
            notification => {
                // Safe comparison - handle potentially undefined values
                const notificationProductId = notification.productId ? notification.productId.toString() : '';
                const currentProductId = productId ? productId.toString() : '';

                return notificationProductId === currentProductId &&
                    notification.color === color &&
                    (size ? notification.size === size : true);
            }
        );

        if (existingNotification) {
            return NextResponse.json({
                success: true,
                message: 'You are already subscribed to notifications for this product'
            });
        }

        // Initialize stockNotifications array if it doesn't exist
        if (!user.stockNotifications) {
            user.stockNotifications = [];
        }

        // Add notification to user's list with all necessary information
        user.stockNotifications.push({
            productId,
            color,
            size,
            date: new Date(),
            productName: productInfo.name,
            brand: productInfo.brand || '',
            category: productInfo.category || '',
            price: productInfo.price,
            productImage: productInfo.image
        });

        await user.save();

        return NextResponse.json({
            success: true,
            message: 'You will be notified when this product is back in stock'
        });
    } catch (error) {
        console.error('Error subscribing to stock notification:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to subscribe to stock notification'
        }, { status: 500 });
    }
}
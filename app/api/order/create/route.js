

import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Orders";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";



export async function POST(request) {
    try {
        await connectDB();

        const auth = getAuth(request);
        const userId = auth.userId;

        if (!userId) {
            console.error('Authentication failed - no userId found');
            return NextResponse.json({
                success: false,
                message: 'Authentication required. Please make sure you are logged in.'
            }, { status: 401 });
        }

        console.log('Order creation request for user:', userId);

        const { address, items, paymentMethod, paymentStatus } = await request.json();
        console.log('Order Create Debug:', { userId, paymentMethod, paymentStatus });

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid data' });
        }

        // calculate amount using items (fix async reduce bug)
        let amount = 0;
        // items: [{ product: cartKey, quantity }], cartKey = productId, productId_color, or productId_color_size
        const orderItems = [];
        // Declare user variable for use throughout function
        let user = null;

        for (const item of items) {
            let productKey = item.product;

            // Check if it's a custom design item
            if (productKey.startsWith('custom_')) {
                const designId = productKey.replace('custom_', '');
                console.log(`Processing custom design with ID: ${designId}`);

                // First try to get the user to fetch custom designs if not already fetched
                if (!user) {
                    user = await User.findById(userId);
                    if (!user) {
                        return NextResponse.json({ success: false, message: 'User not found' });
                    }
                }

                // Get the custom design information from user.customDesigns
                if (user.customDesigns && user.customDesigns[designId]) {
                    const customDesign = user.customDesigns[designId];
                    console.log('Found custom design in user data:', customDesign);

                    // Calculate price from the quote amount (already in rupees)
                    if (!customDesign.quote || !customDesign.quote.amount) {
                        return NextResponse.json({
                            success: false,
                            message: `Custom design "${customDesign.designName || designId}" does not have a valid quote. Please get a quote from the seller before placing an order.`
                        }, { status: 400 });
                    }

                    const price = customDesign.quote.amount;
                    const itemTotal = price * item.quantity;
                    amount += itemTotal;

                    console.log(`Custom design pricing: ${price} × ${item.quantity} = ${itemTotal}, Running total: ${amount}`);

                    // Add to order items with custom design flag
                    // Include 'product' field which is required by the schema
                    orderItems.push({
                        product: designId, // Using designId as the product field to satisfy schema validation
                        isCustomDesign: true,
                        customDesignId: designId,  // Renamed from designId to match schema
                        designName: customDesign.designName || 'Custom Design',
                        customDesignImage: customDesign.designImage || '', // Renamed to match schema
                        quantity: item.quantity,
                        price: price, // Store the unit price for this item
                        color: customDesign.color || 'As specified',
                        size: customDesign.size || 'M'
                    });

                    console.log(`Added custom design to order with price: ${price}`);
                } else {
                    // Custom design not found - this should not happen
                    console.error(`Custom design ${designId} not found in user data`);
                    return NextResponse.json({
                        success: false,
                        message: `Custom design ${designId} not found. Please refresh the page and try again.`
                    }, { status: 400 });
                }
            } else {
                // Regular product item processing
                let productId = productKey;
                let color = undefined;
                let size = undefined;
                if (typeof productId === 'string' && productId.includes('_')) {
                    const split = productId.split('_');
                    productId = split[0];
                    if (split.length === 3) {
                        color = split[1];
                        size = split[2];
                    } else if (split.length === 2) {
                        // Could be color or size
                        // Try to match color format
                        if (split[1].startsWith('#') || split[1].length === 7) {
                            color = split[1];
                        } else {
                            size = split[1];
                        }
                    }
                }
                const product = await Product.findById(productId);
                if (product) {
                    const productTotal = product.offerPrice * item.quantity;
                    amount += productTotal;
                    console.log(`Regular product pricing: ${product.offerPrice} × ${item.quantity} = ${productTotal}, Running total: ${amount}`);
                    // Reduce stock for color if present
                    if (color && Array.isArray(product.color)) {
                        const colorObj = product.color.find(c => c.color === (color.startsWith('#') ? color : `#${color}`));
                        if (colorObj) {
                            colorObj.stock = Math.max(0, (colorObj.stock || 0) - item.quantity);
                        }
                    }
                    // Reduce total stock
                    product.stock = Math.max(0, (product.stock || 0) - item.quantity);
                    await product.save();
                    orderItems.push({
                        product: productId,
                        quantity: item.quantity,
                        price: product.offerPrice,
                        color,
                        size
                    });
                } else {
                    console.error(`Product ${productId} not found`);
                }
            }
        }


        // Direct DB insert for local/dev debugging
        await connectDB();
        console.log('Creating order with items:', JSON.stringify(orderItems));
        console.log('Creating order with userId:', userId);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'Cannot create order: userId is required but was not provided'
            });
        }

        const taxAmount = Math.floor(amount * 0.02);
        const finalAmount = amount + taxAmount;

        console.log(`Order amount calculation: Base: ₹${amount}, Tax (2%): ₹${taxAmount}, Final: ₹${finalAmount}`);

        try {
            const orderData = {
                userId: userId.toString(), // Ensure it's a string
                address,
                items: orderItems,
                amount: finalAmount,
                paymentMethod: paymentMethod || 'COD',
                paymentStatus: paymentStatus || 'Pending',
                date: Math.floor(Date.now() / 1000) // Convert milliseconds to seconds for Unix timestamp
            };

            console.log('Order data for creation:', orderData);
            const newOrder = await Order.create(orderData);
            console.log('Order created successfully with ID:', newOrder._id);
        } catch (orderError) {
            console.error('Order creation failed:', orderError);
            return NextResponse.json({
                success: false,
                message: `Order creation failed: ${orderError.message}`,
                details: orderError.errors ? JSON.stringify(orderError.errors) : null
            });
        }

        // clear user cart
        try {
            if (!user) {
                // If user wasn't fetched earlier, fetch now
                user = await User.findById(userId);
            }

            if (user) {
                user.cartItems = {};
                await user.save();
                console.log('User cart cleared successfully');
            } else {
                console.log(`User with ID ${userId} not found for cart clearing`);
            }
        } catch (cartError) {
            console.error('Error clearing user cart:', cartError);
            // Continue anyway, since the order was already created
        }

        return NextResponse.json({ success: true, message: 'Order Placed' });

    } catch (error) {
        console.error('Order creation error:', error);
        // Return more detailed error information
        return NextResponse.json({
            success: false,
            message: error.message || 'An unexpected error occurred during order creation',
            details: error.errors ? JSON.stringify(error.errors) : null
        }, { status: 500 });
    }
}
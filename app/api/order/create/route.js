

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

        // Debug authentication data
        console.log('Request headers:', Object.fromEntries(request.headers.entries()));

        const auth = getAuth(request);
        console.log('Auth object:', JSON.stringify({
            userId: auth.userId,
            sessionId: auth.sessionId,
            session: auth.session ? 'present' : 'missing',
            user: auth.user ? 'present' : 'missing'
        }));

        const userId = auth.userId;

        if (!userId) {
            console.error('No userId found in auth context:', auth);
            return NextResponse.json({ success: false, message: 'Authentication failed - no user ID found' });
        }

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

                    // Calculate price from the quote amount (in paisa)
                    const price = customDesign.quote && customDesign.quote.amount
                        ? customDesign.quote.amount / 100
                        : 11000; // Default price

                    amount += price * item.quantity;

                    // Add to order items with custom design flag
                    // Include 'product' field which is required by the schema
                    orderItems.push({
                        product: designId, // Using designId as the product field to satisfy schema validation
                        isCustomDesign: true,
                        customDesignId: designId,  // Renamed from designId to match schema
                        designName: customDesign.designName || 'Custom Design',
                        customDesignImage: customDesign.designImage || '', // Renamed to match schema
                        quantity: item.quantity,
                        color: customDesign.color || 'As specified',
                        size: customDesign.size || 'M'
                    });

                    console.log(`Added custom design to order with price: ${price}`);
                } else {
                    // Try to get the design from localStorage via sessionStorage
                    // This is handled client-side, but we still need to handle the order creation
                    console.error(`Custom design ${designId} not found in user data`);
                    // Use fallback price
                    amount += 11000 * item.quantity; // Use default price
                    orderItems.push({
                        product: designId, // Using designId as the product field to satisfy schema validation
                        isCustomDesign: true,
                        customDesignId: designId, // Renamed from designId to match schema
                        designName: 'Custom Design',
                        quantity: item.quantity,
                        color: 'As specified',
                        size: 'M'
                    });
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
                    amount += product.offerPrice * item.quantity;
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
                    orderItems.push({ product: productId, quantity: item.quantity, color, size });
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

        try {
            const orderData = {
                userId: userId.toString(), // Ensure it's a string
                address,
                items: orderItems,
                amount: amount + Math.floor(amount * 0.02),
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
            message: error.message,
            stack: error.stack,
            name: error.name,
            details: error.errors ? JSON.stringify(error.errors) : null
        });
    }
}
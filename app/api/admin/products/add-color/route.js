import { NextResponse } from 'next/server';
import Product from '@/models/Product';
import connectDB from '@/config/db';

export async function POST(request) {
    try {
        await connectDB();

        const { productId, colorName, colorCode, quantities } = await request.json();

        // Validation
        if (!productId || !colorName || !colorCode) {
            return NextResponse.json({
                success: false,
                message: 'Product ID, color name, and color code are required'
            }, { status: 400 });
        }

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({
                success: false,
                message: 'Product not found'
            }, { status: 404 });
        }

        // Check if color already exists
        if (product.inventory.some(item => item.color.name.toLowerCase() === colorName.toLowerCase())) {
            return NextResponse.json({
                success: false,
                message: `Color "${colorName}" already exists for this product`
            }, { status: 400 });
        }

        // Define available sizes
        const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

        // Create new color object
        const newColor = {
            color: {
                name: colorName.trim(),
                code: colorCode,
                image: ''
            },
            sizeStock: availableSizes.map(size => ({
                size,
                quantity: parseInt(quantities?.[size]) || 0,
                lowStockThreshold: 5,
                lastRestocked: new Date()
            }))
        };

        // Add color to inventory
        product.inventory.push(newColor);

        // Recalculate total stock
        product.totalStock = product.inventory.reduce((total, colorData) => {
            return total + colorData.sizeStock.reduce((colorTotal, sizeData) => {
                return colorTotal + sizeData.quantity;
            }, 0);
        }, 0);

        // Update available colors
        product.availableColors = product.inventory
            .filter(item => item.sizeStock.some(size => size.quantity > 0))
            .map(item => item.color.name);

        // Update available sizes
        product.availableSizes = [...new Set(product.inventory.flatMap(item =>
            item.sizeStock.filter(size => size.quantity > 0).map(size => size.size)
        ))];

        // Update backward compatibility fields
        product.color = product.inventory.map(item => ({
            color: item.color.name,
            stock: item.sizeStock.reduce((total, size) => total + size.quantity, 0)
        }));
        product.stock = product.totalStock;

        // Save product
        await product.save();

        //console.log(`✅ New color "${colorName}" added to product: ${productId}`);

        return NextResponse.json({
            success: true,
            message: `Color "${colorName}" added successfully!`,
            product: {
                id: product._id,
                totalStock: product.totalStock,
                availableColors: product.availableColors,
                inventory: product.inventory
            }
        });

    } catch (error) {
        console.error('❌ Error adding color:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to add color: ' + error.message
        }, { status: 500 });
    }
}

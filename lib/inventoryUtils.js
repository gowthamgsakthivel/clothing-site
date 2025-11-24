import Product from "@/models/Product";
import connectDB from "@/config/db";

/**
 * Utility functions for product inventory management
 */

// Check if a product has the new inventory system
export function hasNewInventorySystem(product) {
    return product.inventory && Array.isArray(product.inventory) && product.inventory.length > 0;
}

// Convert old product structure to new inventory system
export function migrateProductToNewInventory(product) {
    if (hasNewInventorySystem(product)) {
        return product; // Already migrated
    }

    // Convert old color/sizes structure to new inventory
    const inventory = [];

    if (product.color && Array.isArray(product.color)) {
        product.color.forEach(colorItem => {
            if (colorItem.color) {
                const colorInventory = {
                    color: {
                        name: colorItem.color,
                        code: getColorCode(colorItem.color), // Helper function to get color code
                        image: ''
                    },
                    sizeStock: []
                };

                // Create size stock for each available size
                if (product.sizes && Array.isArray(product.sizes)) {
                    product.sizes.forEach(size => {
                        colorInventory.sizeStock.push({
                            size: size,
                            quantity: Math.floor((colorItem.stock || 0) / product.sizes.length), // Distribute stock evenly
                            lowStockThreshold: 5,
                            lastRestocked: new Date()
                        });
                    });
                }

                inventory.push(colorInventory);
            }
        });
    }

    // Update product with new inventory structure
    const updatedProduct = {
        ...product,
        inventory,
        totalStock: inventory.reduce((total, colorData) => {
            return total + colorData.sizeStock.reduce((colorTotal, sizeData) => {
                return colorTotal + sizeData.quantity;
            }, 0);
        }, 0),
        availableColors: inventory
            .filter(item => item.sizeStock.some(size => size.quantity > 0))
            .map(item => item.color.name),
        availableSizes: [...new Set(inventory.flatMap(item =>
            item.sizeStock.filter(size => size.quantity > 0).map(size => size.size)
        ))],
        stockSettings: {
            trackInventory: true,
            allowBackorders: false,
            globalLowStockThreshold: 10
        }
    };

    return updatedProduct;
}

// Helper function to get color codes (basic mapping)
function getColorCode(colorName) {
    const colorMap = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'green': '#008000',
        'black': '#000000',
        'white': '#FFFFFF',
        'yellow': '#FFFF00',
        'orange': '#FFA500',
        'purple': '#800080',
        'pink': '#FFC0CB',
        'brown': '#A52A2A',
        'gray': '#808080',
        'grey': '#808080',
        'navy': '#000080',
        'maroon': '#800000',
        'olive': '#808000',
        'lime': '#00FF00',
        'aqua': '#00FFFF',
        'teal': '#008080',
        'silver': '#C0C0C0',
        'fuchsia': '#FF00FF'
    };

    const normalizedColor = colorName.toLowerCase();
    return colorMap[normalizedColor] || '#666666'; // Default gray
}

// Get available stock for a specific color-size combination
export function getAvailableStock(product, colorName, size) {
    if (!hasNewInventorySystem(product)) {
        // Fallback for old system
        return product.stock || 0;
    }

    const colorData = product.inventory.find(item =>
        item.color.name.toLowerCase() === colorName.toLowerCase()
    );

    if (!colorData) {
        return 0;
    }

    const sizeData = colorData.sizeStock.find(item => item.size === size);
    return sizeData ? sizeData.quantity : 0;
}

// Update stock for a specific color-size combination
export async function updateStock(productId, colorName, size, newQuantity) {
    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }

    // Ensure product has new inventory system
    if (!hasNewInventorySystem(product)) {
        const migratedProduct = migrateProductToNewInventory(product);
        await Product.findByIdAndUpdate(productId, migratedProduct);
        product.inventory = migratedProduct.inventory;
    }

    // Find and update the specific color-size combination
    const colorData = product.inventory.find(item =>
        item.color.name.toLowerCase() === colorName.toLowerCase()
    );

    if (!colorData) {
        throw new Error(`Color '${colorName}' not found`);
    }

    const sizeData = colorData.sizeStock.find(item => item.size === size);
    if (!sizeData) {
        throw new Error(`Size '${size}' not found for color '${colorName}'`);
    }

    // Update the quantity
    sizeData.quantity = Math.max(0, parseInt(newQuantity));
    sizeData.lastRestocked = new Date();

    // Recalculate total stock
    product.totalStock = product.inventory.reduce((total, colorData) => {
        return total + colorData.sizeStock.reduce((colorTotal, sizeData) => {
            return colorTotal + sizeData.quantity;
        }, 0);
    }, 0);

    // Update backward compatibility fields
    product.color = product.inventory.map(item => ({
        color: item.color.name,
        stock: item.sizeStock.reduce((total, size) => total + size.quantity, 0)
    }));
    product.stock = product.totalStock;

    await product.save();
    return product;
}

// Get low stock alerts for a product
export function getLowStockAlerts(product) {
    if (!hasNewInventorySystem(product)) {
        if (product.stock <= (product.stockSettings?.globalLowStockThreshold || 10)) {
            return [{
                type: 'product',
                message: `Product "${product.name}" has low stock: ${product.stock} remaining`,
                quantity: product.stock
            }];
        }
        return [];
    }

    const alerts = [];

    product.inventory.forEach(colorData => {
        colorData.sizeStock.forEach(sizeData => {
            if (sizeData.quantity <= sizeData.lowStockThreshold) {
                alerts.push({
                    type: 'variant',
                    color: colorData.color.name,
                    size: sizeData.size,
                    quantity: sizeData.quantity,
                    threshold: sizeData.lowStockThreshold,
                    message: `${colorData.color.name} ${sizeData.size}: ${sizeData.quantity} left`
                });
            }
        });
    });

    return alerts;
}

// Validate cart item stock availability
export function validateCartItemStock(product, colorName, size, requestedQuantity) {
    const availableStock = getAvailableStock(product, colorName, size);

    return {
        isAvailable: availableStock >= requestedQuantity,
        availableStock,
        requestedQuantity,
        canPartialFulfill: availableStock > 0 && availableStock < requestedQuantity,
        message: availableStock >= requestedQuantity
            ? 'In Stock'
            : availableStock > 0
                ? `Only ${availableStock} available`
                : 'Out of Stock'
    };
}
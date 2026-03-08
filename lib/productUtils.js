import ProductV2 from '@/models/v2/Product';
import ProductVariant from '@/models/v2/ProductVariant';
import Inventory from '@/models/v2/Inventory';
import { buildInventoryByVariantId } from '@/lib/v2ProductView';
import connectDB from '@/config/db';

const mapProducts = async (products) => {
    const productIds = products.map((product) => product._id);
    const variants = productIds.length
        ? await ProductVariant.find({
            productId: { $in: productIds },
            visibility: { $ne: 'hidden' }
        }).lean()
        : [];

    const variantIds = variants.map((variant) => variant._id);
    const inventories = variantIds.length
        ? await Inventory.find({ variantId: { $in: variantIds } }).lean()
        : [];

    const inventoryByVariantId = buildInventoryByVariantId(inventories);
    const variantsByProductId = new Map();
    variants.forEach((variant) => {
        const key = String(variant.productId);
        if (!variantsByProductId.has(key)) {
            variantsByProductId.set(key, []);
        }
        variantsByProductId.get(key).push(variant);
    });

    return products.map((product) => {
        const variantsForProduct = variantsByProductId.get(String(product._id)) || [];
        const inventoryForProduct = {};
        variantsForProduct.forEach((variant) => {
            const key = String(variant._id);
            if (inventoryByVariantId[key]) {
                inventoryForProduct[key] = inventoryByVariantId[key];
            }
        });

        return {
            product,
            variants: variantsForProduct,
            inventoryByVariantId: inventoryForProduct
        };
    });
};

/**
 * Fetches all product IDs from the database for sitemap generation
 * @returns {Promise<Array<string>>} Array of product IDs
 */
export async function fetchAllProductIds() {
    try {
        await connectDB();
        const products = await ProductV2.find({ status: 'active' }, '_id').lean();

        // Extract just the ID strings from the products
        return products.map(product => product._id.toString());
    } catch (error) {
        console.error('Error fetching product IDs:', error);
        return [];
    }
}

/**
 * Fetches a product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object|null>} Product object or null if not found
 */
export async function fetchProductById(id) {
    try {
        await connectDB();
        const product = await ProductV2.findById(id).lean();
        if (!product || product.status !== 'active') {
            return null;
        }

        const mapped = await mapProducts([product]);
        return mapped[0] ? JSON.parse(JSON.stringify(mapped[0])) : null;
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        return null;
    }
}

/**
 * Fetches products by category
 * @param {string} category - Category name
 * @param {number} limit - Number of products to fetch
 * @returns {Promise<Array<Object>>} Array of product objects
 */
export async function fetchProductsByCategory(category, limit = 6) {
    try {
        await connectDB();
        const products = await ProductV2.find({ category, status: 'active' })
            .limit(limit)
            .lean();

        const mapped = await mapProducts(products);
        return JSON.parse(JSON.stringify(mapped));
    } catch (error) {
        console.error(`Error fetching products for category ${category}:`, error);
        return [];
    }
}

/**
 * Fetches related products for a given product
 * @param {string} productId - ID of the current product
 * @param {string} category - Category of the current product
 * @returns {Promise<Array<Object>>} Array of related product objects
 */
export async function fetchRelatedProducts(productId, category) {
    try {
        await connectDB();
        const products = await ProductV2.find({
            category,
            status: 'active',
            _id: { $ne: productId }
        })
            .limit(4)
            .lean();

        const mapped = await mapProducts(products);
        return JSON.parse(JSON.stringify(mapped));
    } catch (error) {
        console.error(`Error fetching related products for ${productId}:`, error);
        return [];
    }
}
import Product from '@/models/Product';
import connectDB from '@/config/db';

/**
 * Fetches all product IDs from the database for sitemap generation
 * @returns {Promise<Array<string>>} Array of product IDs
 */
export async function fetchAllProductIds() {
    try {
        await connectDB();
        const products = await Product.find({}, '_id').lean();

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
        const product = await Product.findById(id).lean();

        return product ? JSON.parse(JSON.stringify(product)) : null;
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
        const products = await Product.find({ category })
            .limit(limit)
            .lean();

        return JSON.parse(JSON.stringify(products));
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
        const products = await Product.find({
            category,
            _id: { $ne: productId }
        })
            .limit(4)
            .lean();

        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error(`Error fetching related products for ${productId}:`, error);
        return [];
    }
}
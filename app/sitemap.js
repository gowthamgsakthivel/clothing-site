import { fetchAllProductIds } from '@/lib/productUtils';

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sparrow-sports.vercel.app';

    // Define static routes
    const routes = [
        '',
        '/about',
        '/contact',
        '/all-products',
        '/cart',
        '/my-orders',
        '/order-placed',
        '/search',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1.0 : 0.8,
    }));

    // Fetch all product IDs to generate dynamic product routes
    try {
        const productIds = await fetchAllProductIds();

        const productRoutes = productIds.map((id) => ({
            url: `${baseUrl}/product/${id}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        }));

        return [...routes, ...productRoutes];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return routes;
    }
}
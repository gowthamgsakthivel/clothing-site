import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sparrow-sports.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/owner/',
                '/add-address/',
                '/order-placed/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
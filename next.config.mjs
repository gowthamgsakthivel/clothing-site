/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Image optimization (secure + required for production)
   */
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "sparrow-sports-images.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },

  /**
   * Package import optimization (tree-shaking for large icon & utility libraries)
   */
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', '@clerk/nextjs'],
  },

  /**
   * Compiler options: remove console logs in production builds
   */
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  /**
   * React strict mode (recommended for production)
   */
  reactStrictMode: true,

  /**
   * Security: remove X-Powered-By header
   */
  poweredByHeader: false,

  /**
   * ESLint — DO NOT ignore errors in production
   * Fix warnings instead of hiding them
   */
  eslint: {
    ignoreDuringBuilds: false,
  },

  /**
   * TypeScript — NEVER ignore build errors in production
   */
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

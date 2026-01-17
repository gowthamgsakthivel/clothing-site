/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Image optimization (secure + required for production)
   */
  images: {
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
    ],
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

  /**
   * Webpack safety tweaks (optional but recommended)
   */
  webpack: (config) => {
    config.infrastructureLogging = {
      level: "error",
    };
    return config;
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors/warnings.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ensure type safety in production
    ignoreBuildErrors: false,
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;

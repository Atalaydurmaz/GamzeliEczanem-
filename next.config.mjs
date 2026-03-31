/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dsmcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'us.lazartigue.com',
      },
      // BURAYA EKLEDİK:
      {
        protocol: 'https',
        hostname: 'witcdn.dermoeczanem.com',
      },
    ],
  },
};

export default nextConfig;
/** @type {import('next').NextConfig} */

const securityHeaders = [
  // MIME sniffing koruması — tarayıcı Content-Type'ı zorunlu tutar
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Clickjacking koruması — site yalnızca kendi içinde iframe'e alınabilir
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Referrer sızıntısı önlemi
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Gereksiz tarayıcı API'lerini kapat
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // CSP: XSS + injection saldırılarını sınırla
  // 'unsafe-inline' — Next.js SSR hydration + Tailwind inline stiller için zorunlu
  // 'unsafe-eval'   — framer-motion ve bazı polyfill'ler için gerekebilir; production'da
  //                   nonce tabanlı CSP ile kaldırılabilir
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.iyzipay.com https://sandbox.iyzipay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://picsum.photos https://images.unsplash.com https://cdn.dsmcdn.com https://us.lazartigue.com https://witcdn.dermoeczanem.com https://*.supabase.co",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sandbox.iyzipay.com https://www.iyzipay.com",
      "frame-src 'self' https://www.iyzipay.com https://sandbox.iyzipay.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.iyzipay.com https://sandbox.iyzipay.com",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig = {
  serverExternalPackages: ['iyzipay'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
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
      {
        protocol: 'https',
        hostname: 'witcdn.dermoeczanem.com',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig

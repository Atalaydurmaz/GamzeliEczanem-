/** @type {import('next').NextConfig} */

import { withSentryConfig } from '@sentry/nextjs'

const securityHeaders = [
  // HSTS — tarayıcıya "bu siteye yalnızca HTTPS üzerinden bağlan" der.
  // 2 yıl + alt alan adları + preload listesi için hazır.
  // Vercel zaten Let's Encrypt SSL sağlar; bu header downgrade saldırılarını kapatır.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
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
      // cdn.jsdelivr.net: face-api.js model ağırlıkları (Sanal Makyaj Deneme)
      // *.sentry.io / *.ingest.sentry.io: Sentry hata raporlama (tunnelRoute kullansak da
      // fallback olarak doğrudan gönderim için gerekli)
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.iyzipay.com https://cdn.jsdelivr.net https://*.sentry.io https://*.ingest.sentry.io",
      "frame-src 'self' https://*.iyzipay.com https://www.openstreetmap.org",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      // form-action: 3DS akışında iyzico, banka 3DS sayfalarına ve *.iyzipay.com alt
      // alan adlarına POST yapar. sandbox-api.iyzipay.com dahil hepsi için wildcard.
      "form-action 'self' https://*.iyzipay.com",
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

// ────────────────────────────────────────────────────────────────────
// Sentry yapılandırması
//
// withSentryConfig şunları yapar:
//   - Build sırasında source map'leri Sentry'e yükler (SENTRY_AUTH_TOKEN gerekli)
//   - Webpack bundle'a Sentry SDK'yı entegre eder
//   - "Tunnel" route oluşturur (/monitoring) — adblock'ları bypass eder, hatalar
//     kullanıcıya yansımadan Sentry'e ulaşır
//   - Production'da Sentry source map upload comment'lerini build çıktısından temizler
// ────────────────────────────────────────────────────────────────────
export default withSentryConfig(nextConfig, {
  // Sentry org ve proje slug'ları — sentry.io'daki proje URL'inden alınır.
  // Örn. https://sentry.io/organizations/MY-ORG/projects/MY-PROJECT/ → org: MY-ORG, project: MY-PROJECT
  // Build zamanında source map upload için gerekli; çalışma zamanında kullanılmaz.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Build log'larını sessizleştir (sadece hatalar yazılır)
  silent: !process.env.CI,

  // ⭐ Adblock bypass — Sentry istekleri /monitoring üzerinden proxy'lenir.
  // Tarayıcıdan doğrudan sentry.io'ya gitmediği için uBlock/AdGuard engellemez.
  tunnelRoute: '/monitoring',

  // Source map'leri sadece Sentry'e yüklendikten sonra build çıktısından sil
  // (kullanıcı kaynak kodunu indiremesin diye).
  hideSourceMaps: true,

  webpack: {
    // SDK debug log'larını tree-shake eder (eski `disableLogger` opsiyonunun yerini aldı)
    treeshake: { removeDebugLogging: true },
    // Vercel cron monitoring (kullanmıyorsanız etkisiz, eski top-level
    // `automaticVercelMonitors` opsiyonunun yerini aldı)
    automaticVercelMonitors: false,
  },
})

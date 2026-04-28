// Server-side Sentry başlatma — Node.js runtime için (App Router route handlers,
// Server Components, server actions, API routes).
// Bu dosya instrumentation.js içinden NEXT_RUNTIME === 'nodejs' olduğunda yüklenir.
//
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // DSN — Sentry projesinden alınır. Yoksa init no-op olur (hata fırlatmaz).
  dsn: process.env.SENTRY_DSN,

  // Ortam etiketi — Sentry UI'da filtreleme için kullanılır
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Performance monitoring — örnekleme oranı.
  // 1.0 = tüm transaction'ları yolla (geliştirmede iyi).
  // Production'da 0.1-0.2 yeterli — Sentry kotanı yememek için.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Debug log'ları — sadece dev'de açık
  debug: false,

  // Ödeme ve sipariş gibi kritik akışlarda PII (kişisel veri) yakalanması
  // için açıyoruz. Yine de aşağıdaki beforeSend ile hassas alanları temizliyoruz.
  sendDefaultPii: true,

  // Hata öncesi son işlem
  beforeSend(event, hint) {
    // Hassas başlıkları (Authorization, Cookie) maskele
    if (event.request?.headers) {
      const h = event.request.headers
      if (h.authorization) h.authorization = '[Filtered]'
      if (h.cookie) h.cookie = '[Filtered]'
      if (h['x-iyzi-signature-v3']) h['x-iyzi-signature-v3'] = '[Filtered]'
    }

    // Kart numarası, CVV gibi alanları breadcrumb'lardan temizle
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => {
        if (b.data) {
          for (const key of Object.keys(b.data)) {
            if (/card|cvv|pan|password|secret|token/i.test(key)) {
              b.data[key] = '[Filtered]'
            }
          }
        }
        return b
      })
    }

    return event
  },

  // Tarayıcı veya bilinen "noise" hatalarını filtrele.
  // Server tarafında genellikle gerek yok, ama Next.js'in NEXT_NOT_FOUND
  // ve NEXT_REDIRECT internal "hatalarını" görmezden gel.
  ignoreErrors: [
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],
})

// Client-side Sentry başlatma — tarayıcıda çalışır.
// Next.js 15.3+ konvansiyonu. Proje `src/` kullandığı için bu dosya da `src/`
// altında olmalı — Next.js 16 root'taki instrumentation-client.js'i src varsa
// görmez. Eski `sentry.client.config.js` adının yerini aldı (Sentry SDK v9+).
// NEXT_PUBLIC_SENTRY_DSN değişkeni browser'a sızdığı için DSN public olarak
// kullanılabilir — Sentry'nin DSN tasarımı bunu varsayar.

import * as Sentry from '@sentry/nextjs'

// Dev'de HMR (hot reload) bu modülü yeniden çalıştırır. Sentry.init() iki kere
// çağrılırsa Session Replay integration "Multiple Sentry Session Replay instances
// are not supported" diye console.error basar — bu da global onerror üzerinden
// tekrar Sentry'e gönderilir, kotanı yer. Window flag'i ile tek seferlik garanti
// altına alıyoruz.
if (typeof window !== 'undefined' && !window.__SENTRY_CLIENT_INITIALIZED__) {
  window.__SENTRY_CLIENT_INITIALIZED__ = true

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Browser performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay — kullanıcı oturumunu video gibi izle.
    // %10 normal, %100 hatalı oturumlarda kaydet.
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        // Tüm input metinlerini maskele (kart numarası, parola, vb.)
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],

    debug: false,

    // Yaygın "noise" hatalarını ele
    ignoreErrors: [
      // Tarayıcı uzantı hatalarını filtrele
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network'den ileri gelen hatalar (offline kullanıcılar)
      'NetworkError',
      'Failed to fetch',
      // Next.js internal
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
      // Dev'de HMR re-init kaynaklı (idempotent guard'a rağmen ekstra koruma)
      'Multiple Sentry Session Replay instances are not supported',
    ],

    beforeSend(event) {
      // Üçüncü parti script'lerden gelen hataları görmezden gel
      if (event.exception?.values?.[0]?.stacktrace?.frames) {
        const frames = event.exception.values[0].stacktrace.frames
        const lastFrame = frames[frames.length - 1]
        if (lastFrame?.filename?.includes('chrome-extension://')) return null
        if (lastFrame?.filename?.includes('moz-extension://')) return null
      }
      return event
    },
  })
}

// Client-side router transition'ları için tracing'i yakala
// (App Router navigation'ları otomatik span'lerle izlenir).
// Top-level export — guard'ın dışında kalır, modül her import'ta aynı referansı verir.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

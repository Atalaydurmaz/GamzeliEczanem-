// Edge runtime Sentry başlatma — middleware ve edge route'ları için.
// Bu dosya instrumentation.js içinden NEXT_RUNTIME === 'edge' olduğunda yüklenir.
//
// Edge runtime kısıtlamaları nedeniyle bazı Sentry özellikleri burada çalışmaz
// (filesystem yok, native module'ler yok). Init aynı API'yı kullanır.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  debug: false,

  ignoreErrors: ['NEXT_NOT_FOUND', 'NEXT_REDIRECT'],
})

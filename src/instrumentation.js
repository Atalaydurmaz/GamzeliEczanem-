// Next.js 13+ Instrumentation hook'u
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
//
// Bu dosya:
//  1) register() — server boot olduğunda runtime'a göre Sentry config'ini yükler
//  2) onRequestError — App Router route handler ve Server Component hatalarını
//     otomatik olarak Sentry'e iletir (Next.js 15+ feature)
//
// Konum: Proje `src/` konvansiyonunu kullandığı için bu dosya `src/` altında
// olmalı (root'ta DEĞİL). Next.js 16 src/ varsa root'taki instrumentation.js'i
// görmez. Sentry config dosyaları kökte tutuldu — relative path bu yüzden `../`.

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

// Next.js 15+ içinde tüm server-side route ve RSC hatalarını yakalar.
// Manuel try/catch yazmana gerek yok — Sentry otomatik olarak context'le birlikte alır.
export const onRequestError = Sentry.captureRequestError

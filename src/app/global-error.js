'use client'

// Root error boundary — sadece root layout'taki hatalar buraya düşer.
// Daha alt seviyede error.js dosyaları (örn. src/app/(shop)/error.js) varsa
// onlar önce yakalar.
//
// Sentry.captureException ile kullanıcının yaşadığı runtime hatasını otomatik
// gönder. instrumentation.js'in onRequestError hook'u SADECE server hatalarını
// yakalar; client-side render/event hatalarını bu dosya yakalar.

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="tr">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#fff',
          color: '#1a1a1a',
        }}>
          <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Bir şeyler ters gitti
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Beklenmedik bir hata oluştu. Geliştirici ekibimiz otomatik olarak bilgilendirildi.
              Lütfen sayfayı yeniden yüklemeyi deneyin.
            </p>
            {error?.digest && (
              <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '1.5rem' }}>
                Hata referansı: <code>{error.digest}</code>
              </p>
            )}
            <button
              onClick={() => reset()}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Yeniden dene
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

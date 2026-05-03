// Next.js 13+ Instrumentation hook'u
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
//
// NOT: Sentry geçici olarak devre dışı — Vercel build sırasında
// '@sentry/nextjs' paketini install etmesine rağmen 'Module not found'
// veriyor. Sebep tespit edilince geri alınacak. Bu sürede uygulama
// Sentry olmadan çalışır; client-side hatalar tarayıcı console'una düşer.

export async function register() {
  // no-op
}

export const onRequestError = () => null

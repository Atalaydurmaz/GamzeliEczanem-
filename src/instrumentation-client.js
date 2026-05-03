// Client-side Sentry başlatma — geçici olarak devre dışı.
// Vercel build sırasında '@sentry/nextjs' paketi resolve edilemiyor.
// Sentry tekrar etkinleştirildiğinde bu dosya orijinal hâline döndürülecek.

export const onRouterTransitionStart = () => null

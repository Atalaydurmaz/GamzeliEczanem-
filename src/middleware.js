import { NextResponse } from 'next/server'

// Giriş gerektirmeyen /hesabim alt yolları
const ACIK_YOLLAR = [
  '/hesabim/giris',
  '/hesabim/kayit',
  '/hesabim/sifremi-unuttum',
]

export function middleware(req) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/hesabim')) return NextResponse.next()
  if (ACIK_YOLLAR.some((y) => pathname.startsWith(y))) return NextResponse.next()

  // NextAuth session cookie (Google girişi)
  const nextAuthCookie =
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token')

  // Custom auth cookie (email/şifre girişi) — imza middleware'de doğrulanmaz,
  // asıl güvenlik API katmanında getCurrentUserEmail() ile sağlanır
  const gecOturum = req.cookies.get('gec_oturum')

  if (!nextAuthCookie && !gecOturum) {
    const giris = new URL('/hesabim/giris', req.url)
    giris.searchParams.set('redirect', pathname)
    return NextResponse.redirect(giris)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/hesabim/:path*'],
}

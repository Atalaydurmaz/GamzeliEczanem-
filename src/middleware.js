import { NextResponse } from 'next/server'

// ─── /hesabim: Giriş gerektirmeyen alt yollar ────────────────────────────────
const HESABIM_ACIK_YOLLAR = [
  '/hesabim/giris',
  '/hesabim/kayit',
  '/hesabim/sifremi-unuttum',
]

// ─── /admin: Web Crypto ile HMAC-SHA256 doğrulaması (Edge runtime uyumlu) ────
// Node.js'deki: createHmac('sha256', password).update(scope).digest('hex')
// ile birebir aynı çıktıyı üretir; mevcut gla_admin cookie'leri geçerli kalır.
const ADMIN_COOKIE_NAME  = 'gla_admin'
const ADMIN_SESSION_SCOPE = 'gamzelieczanem:admin:v1'

async function makeAdminToken(password) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(ADMIN_SESSION_SCOPE))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function isAdminCookieValid(req) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return false

  const password = process.env.ADMIN_PASSWORD
  // ADMIN_PASSWORD ayarlanmamışsa erişimi kapat (fail-closed)
  if (!password) return false

  try {
    const expected = await makeAdminToken(password)
    // Zamanlama saldırılarına karşı sabit zamanlı karşılaştırma
    if (token.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl

  // ── /admin koruması ────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // /admin/giris sayfasına doğrudan erişime izin ver (login formu burada)
    if (pathname.startsWith('/admin/giris')) return NextResponse.next()

    const adminGecerli = await isAdminCookieValid(req)
    if (!adminGecerli) {
      const giris = new URL('/admin/giris', req.url)
      giris.searchParams.set('redirect', pathname)
      return NextResponse.redirect(giris)
    }

    return NextResponse.next()
  }

  // ── /hesabim koruması ──────────────────────────────────────────────────────
  if (pathname.startsWith('/hesabim')) {
    if (HESABIM_ACIK_YOLLAR.some((y) => pathname.startsWith(y))) {
      return NextResponse.next()
    }

    // NextAuth session cookie (Google girişi)
    const nextAuthCookie =
      req.cookies.get('next-auth.session-token') ||
      req.cookies.get('__Secure-next-auth.session-token')

    // Custom auth cookie (email/şifre girişi) — imza middleware'de doğrulanmaz;
    // asıl güvenlik API katmanında getCurrentUserEmail() ile sağlanır.
    const gecOturum = req.cookies.get('gec_oturum')

    if (!nextAuthCookie && !gecOturum) {
      const giris = new URL('/hesabim/giris', req.url)
      giris.searchParams.set('redirect', pathname)
      return NextResponse.redirect(giris)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/hesabim/:path*', '/admin/:path*', '/admin'],
}

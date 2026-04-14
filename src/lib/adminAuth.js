import { createHmac } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'gla_admin'
const SESSION_SCOPE = 'gamzelieczanem:admin:v1'

// ADMIN_PASSWORD'dan türetilmiş HMAC token — şifrenin kendisi cookie'de saklanmaz
function makeToken(password) {
  return createHmac('sha256', password).update(SESSION_SCOPE).digest('hex')
}

export async function isAdmin() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token || !process.env.ADMIN_PASSWORD) return false
  return token === makeToken(process.env.ADMIN_PASSWORD)
}

export async function setAdminCookie() {
  const store = await cookies()
  // Session cookie (maxAge yok) → tarayıcı kapanınca silinir.
  // Her yeni oturumda admin şifre girmek ZORUNDA — kalıcı giriş yok.
  store.set(COOKIE_NAME, makeToken(process.env.ADMIN_PASSWORD), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

export async function clearAdminCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

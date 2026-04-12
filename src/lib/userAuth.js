import { createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from './authOptions'

const COOKIE_NAME = 'gec_oturum'

function makeToken(email) {
  return createHmac('sha256', process.env.NEXTAUTH_SECRET || 'gec-fallback-secret')
    .update(email.toLowerCase())
    .digest('hex')
}

export async function setUserSessionCookie(email) {
  const store = await cookies()
  store.set(COOKIE_NAME, `${email.toLowerCase()}:${makeToken(email)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 gün
    path: '/',
  })
}

export async function clearUserSessionCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/**
 * Cookie'den email okur ve imzayı doğrular.
 * Geçersiz/sahte cookie → null döner.
 */
export async function getEmailFromSessionCookie() {
  const store = await cookies()
  const value = store.get(COOKIE_NAME)?.value
  if (!value) return null
  const colonIdx = value.indexOf(':')
  if (colonIdx === -1) return null
  const email = value.slice(0, colonIdx)
  const token = value.slice(colonIdx + 1)
  if (!email || makeToken(email) !== token) return null
  return email
}

/**
 * Mevcut kullanıcının email'ini döner.
 * NextAuth (Google) → session'dan
 * Email/şifre → HttpOnly cookie'den
 * Giriş yapılmamış → null
 */
export async function getCurrentUserEmail() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email) return session.user.email.toLowerCase()
  return await getEmailFromSessionCookie()
}

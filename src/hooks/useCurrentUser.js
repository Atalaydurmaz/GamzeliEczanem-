'use client'

import { useAuth } from '@/context/AuthContext'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

/**
 * Her iki auth sistemini (email/şifre + Google) birleştiren hook.
 * Email/şifre ile giriş → AuthContext
 * Google ile giriş     → NextAuth session
 */
export function useCurrentUser() {
  const { kullanici, yukleniyor: authYukleniyor, cikisYap } = useAuth()
  const { data: session, status } = useSession()

  const yukleniyor = authYukleniyor || status === 'loading'

  // Email/şifre ile giriş yapılmış
  if (kullanici) {
    return {
      kullanici,
      yukleniyor: false,
      googleGiris: false,
      cikisYap,
    }
  }

  // Google ile giriş yapılmış
  if (session?.user) {
    return {
      kullanici: {
        id: session.user.email,
        ad: session.user.name,
        email: session.user.email,
        avatar: session.user.image,
      },
      yukleniyor: false,
      googleGiris: true,
      cikisYap: () => nextAuthSignOut({ callbackUrl: '/' }),
    }
  }

  return { kullanici: null, yukleniyor, googleGiris: false, cikisYap: () => {} }
}

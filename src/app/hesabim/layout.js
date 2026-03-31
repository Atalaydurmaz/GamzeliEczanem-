'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const menuItems = [
  {
    href: '/hesabim',
    label: 'Genel Bakış',
    ikon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/hesabim/siparisler',
    label: 'Siparişlerim',
    ikon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    href: '/hesabim/favoriler',
    label: 'Favorilerim',
    ikon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    href: '/hesabim/adresler',
    label: 'Adreslerim',
    ikon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/hesabim/profil',
    label: 'Profilim',
    ikon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function HesabimLayout({ children }) {
  const { kullanici, yukleniyor, cikisYap } = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()

  const acikSayfalar = ['/hesabim/giris', '/hesabim/kayit', '/hesabim/sifremi-unuttum']

  useEffect(() => {
    if (!yukleniyor && !kullanici && !acikSayfalar.includes(pathname)) {
      router.push('/hesabim/giris')
    }
  }, [kullanici, yukleniyor, pathname])

  if (acikSayfalar.includes(pathname)) return children

  if (yukleniyor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!kullanici) return null

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
              {/* Kullanıcı bilgisi */}
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3">
                  {kullanici.ad.charAt(0).toUpperCase()}
                </div>
                <p className="font-bold text-base leading-tight">{kullanici.ad}</p>
                <p className="text-rose-200 text-xs mt-0.5 truncate">{kullanici.email}</p>
              </div>

              {/* Menü */}
              <nav className="py-2">
                {menuItems.map((item) => {
                  const aktif = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                        aktif
                          ? 'text-rose-700 bg-rose-50 border-r-2 border-rose-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-rose-600'
                      }`}
                    >
                      <span className={aktif ? 'text-rose-600' : 'text-gray-400'}>{item.ikon}</span>
                      {item.label}
                    </Link>
                  )
                })}

                <div className="mx-4 my-2 border-t border-gray-100" />

                <button
                  onClick={() => { cikisYap(); router.push('/') }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Çıkış Yap
                </button>
              </nav>
            </div>
          </aside>

          {/* İçerik */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

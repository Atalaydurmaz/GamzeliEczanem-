'use client'

import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const ozet = [
  { href: '/hesabim/siparisler', label: 'Siparişlerim', ikon: '📦', renk: 'bg-rose-50 text-rose-700 border-rose-100' },
  { href: '/hesabim/favoriler', label: 'Favorilerim', ikon: '❤️', renk: 'bg-pink-50 text-pink-700 border-pink-100' },
  { href: '/hesabim/adresler', label: 'Adreslerim', ikon: '📍', renk: 'bg-orange-50 text-orange-700 border-orange-100' },
  { href: '/hesabim/profil', label: 'Profilim', ikon: '👤', renk: 'bg-purple-50 text-purple-700 border-purple-100' },
]

export default function HesabimSayfasi() {
  const { kullanici } = useCurrentUser()
  if (!kullanici) return null

  const kayitTarihi = kullanici.kayitTarihi
    ? new Date(kullanici.kayitTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-6">
      {/* Hoş geldin kartı */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
        <h1 className="text-xl font-bold text-stone-900 mb-1">
          Hoş geldiniz, {kullanici.ad.split(' ')[0]}! 👋
        </h1>
        <p className="text-stone-500 text-sm">
          Hesabınızı buradan yönetebilirsiniz.
          {kayitTarihi && <span className="ml-1 text-stone-400">· Üyelik: {kayitTarihi}</span>}
        </p>
      </div>

      {/* Hızlı erişim kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ozet.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-2 p-5 rounded-2xl border ${item.renk} hover:shadow-md transition-all text-center`}
          >
            <span className="text-3xl">{item.ikon}</span>
            <span className="text-sm font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Son siparişler placeholder */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-stone-900">Son Siparişler</h2>
          <Link href="/hesabim/siparisler" className="text-xs text-rose-600 hover:underline font-medium">
            Tümünü Gör →
          </Link>
        </div>
        <div className="text-center py-10 text-stone-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-medium text-stone-500">Henüz siparişiniz bulunmuyor.</p>
          <Link href="/" className="mt-3 inline-block text-sm text-rose-600 hover:underline font-medium">
            Alışverişe Başla →
          </Link>
        </div>
      </div>
    </div>
  )
}

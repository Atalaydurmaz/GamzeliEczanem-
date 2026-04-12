'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Suspense } from 'react'

const ozet = [
  { href: '/hesabim/siparisler', label: 'Siparişlerim', ikon: '📦', renk: 'bg-rose-50 text-rose-700 border-rose-100' },
  { href: '/hesabim/favoriler', label: 'Favorilerim', ikon: '❤️', renk: 'bg-pink-50 text-pink-700 border-pink-100' },
  { href: '/hesabim/adresler', label: 'Adreslerim', ikon: '📍', renk: 'bg-orange-50 text-orange-700 border-orange-100' },
  { href: '/hesabim/profil', label: 'Profilim', ikon: '👤', renk: 'bg-purple-50 text-purple-700 border-purple-100' },
]

function HesabimIcerik() {
  const { kullanici } = useCurrentUser()
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mesaj = searchParams.get('mesaj')

  useEffect(() => {
    // Google ile ilk kez giriş yaptıysa ve şifresi yoksa şifre kurulum sayfasına yönlendir
    // SADECE mesaj parametresi yoksa yönlendir (sonsuz döngüyü önle)
    if (session?.user?.sifreKurulumu && !mesaj) {
      router.push('/hesabim/sifre-olustur')
    }
  }, [session, router, mesaj])

  if (!kullanici) return null

  const kayitTarihi = (kullanici.kayit_tarihi || kullanici.kayitTarihi)
    ? new Date(kullanici.kayit_tarihi || kullanici.kayitTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-6">
      {/* Şifre oluşturuldu başarı mesajı */}
      {mesaj === 'sifre-olusturuldu' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-sm text-green-700 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold">Şifreniz başarıyla oluşturuldu!</p>
            <p className="text-green-600 text-xs mt-0.5">Artık e-posta ve şifrenizle de giriş yapabilirsiniz.</p>
          </div>
        </div>
      )}

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

export default function HesabimSayfasi() {
  return (
    <Suspense fallback={null}>
      <HesabimIcerik />
    </Suspense>
  )
}

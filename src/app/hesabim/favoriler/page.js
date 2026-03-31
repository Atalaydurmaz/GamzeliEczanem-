'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useFavori } from '@/context/FavoriContext'
import { useCart } from '@/context/CartContext'

export default function FavorilerimSayfasi() {
  const { favoriler, favoriKaldir } = useFavori()
  const { sepeteEkle } = useCart()

  if (favoriler.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-stone-900 mb-6">Favorilerim</h2>
        <div className="text-center py-14">
          <p className="text-5xl mb-4">❤️</p>
          <h3 className="text-base font-semibold text-stone-700 mb-2">Favori listeniz boş</h3>
          <p className="text-sm text-stone-400 mb-6">Beğendiğiniz ürünlerin kalp ikonuna tıklayarak buraya ekleyebilirsiniz.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-full hover:bg-rose-700 transition-colors"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-stone-900">
          Favorilerim
          <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-semibold rounded-full">
            {favoriler.length}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {favoriler.map((urun) => (
          <div
            key={urun.id}
            className="flex gap-4 p-4 border border-stone-100 rounded-xl hover:border-rose-100 hover:bg-rose-50/30 transition-all group"
          >
            {/* Görsel */}
            <Link href={`/urunler/${urun.id}`} className="shrink-0">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-rose-50">
                <Image
                  src={urun.gorsel}
                  alt={urun.ad}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="80px"
                />
              </div>
            </Link>

            {/* Bilgi */}
            <div className="flex-1 min-w-0">
              <Link href={`/urunler/${urun.id}`}>
                <p className="text-xs text-rose-400 font-medium uppercase tracking-wider mb-0.5">
                  {{ 'cilt-bakimi': 'Cilt Bakımı', makyaj: 'Makyaj', parfum: 'Parfüm', 'sac-bakimi': 'Saç Bakımı' }[urun.kategori] ?? urun.kategori}
                </p>
                <h3 className="text-sm font-semibold text-stone-800 line-clamp-2 hover:text-rose-600 transition-colors mb-1">
                  {urun.ad}
                </h3>
              </Link>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-base font-bold text-stone-900">
                  {urun.fiyat.toLocaleString('tr-TR')} ₺
                </span>
                {urun.eskiFiyat && (
                  <span className="text-xs text-stone-400 line-through">
                    {urun.eskiFiyat.toLocaleString('tr-TR')} ₺
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sepeteEkle(urun)}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Sepete Ekle
                </button>
                <button
                  onClick={() => favoriKaldir(urun.id)}
                  aria-label="Favorilerden kaldır"
                  className="w-8 h-8 flex items-center justify-center border border-stone-200 rounded-lg text-stone-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alt bağlantı */}
      <div className="mt-6 pt-5 border-t border-stone-100 text-center">
        <Link href="/" className="text-sm text-rose-600 hover:underline font-medium">
          Alışverişe Devam Et →
        </Link>
      </div>
    </div>
  )
}

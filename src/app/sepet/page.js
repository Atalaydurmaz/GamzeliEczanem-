'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import SepetEmailKayit from '@/components/SepetEmailKayit'

export default function SepetSayfasi() {
  const { sepet, sepettenCikar, adediGuncelle, toplamFiyat, kargoUcreti, toplamAdet } = useCart()

  if (sepet.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white px-4">
        <div className="text-7xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-stone-800 mb-3">Sepetiniz boş</h2>
        <p className="text-stone-400 mb-8 text-center max-w-sm">
          Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayabilirsiniz.
        </p>
        <div className="flex gap-4">
          <Link
            href="/makyaj"
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-full transition-colors"
          >
            Makyaj
          </Link>
          <Link
            href="/cilt-bakimi"
            className="px-6 py-3 border-2 border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-colors"
          >
            Cilt Bakımı
          </Link>
        </div>
      </div>
    )
  }

  const genelToplam = toplamFiyat + kargoUcreti

  return (
    <div className="bg-rose-50/30 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">
          Sepetim <span className="text-lg font-normal text-stone-400">({toplamAdet} ürün)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {sepet.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4 flex gap-4"
              >
                <Link href={`/urunler/${item.id}`} className="shrink-0">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-rose-50">
                    <Image
                      src={item.gorsel}
                      alt={item.ad}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-rose-400 font-medium uppercase tracking-wider mb-0.5">
                    {item.kategori === 'cilt-bakimi' ? 'Cilt Bakımı' : item.kategori === 'makyaj' ? 'Makyaj' : 'Yüz Bakımı'}
                  </p>
                  <Link href={`/urunler/${item.id}`}>
                    <h3 className="text-sm font-semibold text-stone-800 hover:text-rose-600 transition-colors line-clamp-2 mb-2">
                      {item.ad}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 border border-rose-200 rounded-full overflow-hidden">
                      <button
                        onClick={() => adediGuncelle(item.id, item.adet - 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-lg font-medium"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-stone-800">
                        {item.adet}
                      </span>
                      <button
                        onClick={() => adediGuncelle(item.id, item.adet + 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-lg font-medium"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-base font-bold text-stone-900">
                        {(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺
                      </span>
                      <button
                        onClick={() => sepettenCikar(item.id)}
                        className="text-stone-300 hover:text-rose-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-bold text-stone-900 mb-5">Sipariş Özeti</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Ara Toplam ({toplamAdet} ürün)</span>
                  <span>{toplamFiyat.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Kargo</span>
                  {toplamFiyat >= 1250 ? (
                    <span className="text-emerald-600 font-medium">Ücretsiz</span>
                  ) : (
                    <span>{kargoUcreti.toLocaleString('tr-TR')} ₺</span>
                  )}
                </div>
                {toplamFiyat < 1250 && (
                  <p className="text-xs text-stone-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    1.250 ₺ üzeri alışverişlerde kargo ücretsiz!
                  </p>
                )}
              </div>

              <div className="border-t border-rose-100 pt-4 mb-5">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Toplam</span>
                  <span className="text-lg text-rose-600">{genelToplam.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>

              <Link
                href="/odeme"
                className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-center rounded-full transition-all hover:shadow-lg hover:shadow-rose-200 active:scale-95"
              >
                Ödemeye Geç →
              </Link>

              <Link
                href="/"
                className="block w-full py-3 text-rose-500 hover:text-rose-600 font-medium text-center text-sm mt-3 transition-colors"
              >
                Alışverişe Devam Et
              </Link>

              <SepetEmailKayit />

              <div className="mt-5 pt-5 border-t border-rose-100 grid grid-cols-2 gap-2">
                {[
                  { ikon: '🔒', text: 'Güvenli ödeme' },
                  { ikon: '↩️', text: '30 gün iade' },
                  { ikon: '🚚', text: 'Hızlı teslimat' },
                  { ikon: '✅', text: 'Orijinal ürün' },
                ].map((m) => (
                  <div key={m.text} className="flex items-center gap-1.5 text-xs text-stone-400">
                    <span>{m.ikon}</span>
                    <span>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
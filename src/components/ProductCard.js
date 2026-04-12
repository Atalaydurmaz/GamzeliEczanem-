'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useFavori } from '@/context/FavoriContext'
import { useReviews } from '@/context/ReviewContext'
import { useStock } from '@/context/StockContext'

export default function ProductCard({ urun, index = 0 }) {
  const { favoriMi, favoriToggle } = useFavori()
  const { getUrunStats } = useReviews()
  const { getUrunStok } = useStock()
  const favori = favoriMi(urun.id)
  const stok = getUrunStok(urun.id)
  const stokTukendi = stok !== null && stok === 0
  const reviewStats = getUrunStats(urun.id)
  const puan = reviewStats ? reviewStats.puan : 0
  const yorumSayisi = reviewStats ? reviewStats.yorumSayisi : 0
  const [gorselHata, setGorselHata] = useState(false)

  function handleFavori(e) {
    e.preventDefault()
    e.stopPropagation()
    favoriToggle(urun)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
    >
      <Link href={`/urunler/${urun.id}`} className="group block">
        <motion.div
          whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(244,63,94,0.12)' }}
          transition={{ duration: 0.25 }}
          className={`bg-white rounded-2xl overflow-hidden border shadow-sm ${stokTukendi ? 'border-stone-200 opacity-75' : 'border-rose-100'}`}
        >
          {/* Görsel */}
          <div className="relative aspect-square bg-rose-50 overflow-hidden">
            {gorselHata ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-rose-200">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-rose-300">Görsel yok</span>
              </div>
            ) : (
              <Image
                src={urun.gorsel}
                alt={`${urun.ad} – ${{ 'cilt-bakimi': 'Cilt Bakımı', makyaj: 'Makyaj', parfum: 'Parfüm', 'sac-bakimi': 'Saç Bakımı', 'gunes-bakimi': 'Güneş Koruyucu', 'anne-bebek': 'Anne & Bebek', 'agiz-bakimi': 'Ağız Bakımı' }[urun.kategori] ?? urun.kategori} | GAMZELİECZANEM`}
                fill
                className={`object-cover transition-transform duration-500 ${stokTukendi ? '' : 'group-hover:scale-105'}`}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={() => setGorselHata(true)}
              />
            )}
            {stokTukendi ? (
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-stone-600 text-white text-xs font-semibold rounded-full">
                Stok Tükendi
              </span>
            ) : urun.etiket ? (
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-rose-500 text-white text-xs font-semibold rounded-full">
                {urun.etiket}
              </span>
            ) : null}
            {!stokTukendi && urun.eskiFiyat && (
              <span className="absolute top-3 right-10 px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                İndirim
              </span>
            )}
            {/* Favori butonu */}
            <motion.button
              onClick={handleFavori}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              aria-label={favori ? 'Favorilerden kaldır' : 'Favorilere ekle'}
              className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full shadow transition-colors ${
                favori
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/90 text-stone-400 hover:bg-rose-50 hover:text-rose-500'
              }`}
            >
              <svg className="w-4 h-4" fill={favori ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </motion.button>
          </div>

          {/* Bilgi */}
          <div className="p-2 sm:p-4">
            <p className="text-xs text-rose-400 font-medium uppercase tracking-wider mb-1 hidden sm:block">
              {{ 'cilt-bakimi': 'Cilt Bakımı', makyaj: 'Makyaj', parfum: 'Parfüm', 'sac-bakimi': 'Saç Bakımı', 'gunes-bakimi': 'Güneş Koruyucu' }[urun.kategori] ?? urun.kategori}
            </p>
            <h3 className="text-xs sm:text-sm font-semibold text-stone-800 mb-1 sm:mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
              {urun.ad}
            </h3>
            <p className="text-xs text-stone-400 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">{urun.aciklama}</p>

            {/* Puan */}
            <div className="flex items-center gap-1 mb-2 sm:mb-3">
              {[1, 2, 3, 4, 5].map((yildiz) => (
                <svg
                  key={yildiz}
                  className={`w-3.5 h-3.5 ${yildiz <= Math.round(puan) ? 'text-amber-400' : 'text-stone-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-stone-400 ml-1">({yorumSayisi})</span>
            </div>

            {/* Fiyat */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-base font-bold text-stone-900">
                  {urun.fiyat.toLocaleString('tr-TR')} ₺
                </span>
                {urun.eskiFiyat && (
                  <span className="text-xs text-stone-400 line-through">
                    {urun.eskiFiyat.toLocaleString('tr-TR')} ₺
                  </span>
                )}
              </div>
              <span className="text-xs text-rose-500 font-medium group-hover:underline">
                İncele →
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

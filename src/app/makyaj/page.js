'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { getMakyajUrunleri, makyajKategorileri } from '@/lib/data'

const siralamaSecenekleri = [
  { value: 'varsayilan', label: 'Önerilen' },
  { value: 'fiyat-artan', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-azalan', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'puan', label: 'En Yüksek Puan' },
]

const tumMakyajUrunleri = getMakyajUrunleri()

export default function MakyajSayfasi() {
  const [aktifKategori, setAktifKategori] = useState('tumu')
  const [siralama, setSiralama] = useState('varsayilan')
  const [aramaMetni, setAramaMetni] = useState('')

  const filtreliUrunler = useMemo(() => {
    let liste = [...tumMakyajUrunleri]

    if (aktifKategori !== 'tumu') {
      liste = liste.filter((u) => u.altKategori === aktifKategori)
    }

    if (aramaMetni.trim()) {
      const kucuk = aramaMetni.toLowerCase()
      liste = liste.filter(
        (u) => u.ad.toLowerCase().includes(kucuk) || u.aciklama.toLowerCase().includes(kucuk)
      )
    }

    switch (siralama) {
      case 'fiyat-artan': liste.sort((a, b) => a.fiyat - b.fiyat); break
      case 'fiyat-azalan': liste.sort((a, b) => b.fiyat - a.fiyat); break
      case 'puan': liste.sort((a, b) => b.puan - a.puan); break
    }

    return liste
  }, [aktifKategori, siralama, aramaMetni])

  return (
    <div className="bg-white min-h-screen">
      {/* Sayfa başlığı */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">💄</span>
            <h1 className="text-4xl font-bold text-stone-900">Makyaj</h1>
          </div>
          <p className="text-stone-500">
            Ruj, fondöten, maskara, far, allık ve eyeliner koleksiyonları — {filtreliUrunler.length} ürün
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* AR Virtual Try-On Banner */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-5 mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0">✨</span>
            <div className="min-w-0">
              <p className="text-white font-bold text-base sm:text-lg leading-tight">Sanal Makyaj Deneme</p>
              <p className="text-rose-100 text-sm truncate">Selfie yükle, allık ve göz farı renklerini yüzünde gör</p>
            </div>
          </div>
          <Link
  href="/makyaj/sanal-deneme"
  className="shrink-0 bg-white text-rose-600 px-6 py-2.5 rounded-full text-sm font-bold 
             transition-all duration-500 ease-in-out animate-pulse
             shadow-[0_0_15px_rgba(255,255,255,0.4)] 
             hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] hover:text-rose-700 
             active:scale-95 active:shadow-inner 
             border border-white/30 backdrop-blur-sm flex items-center justify-center"
>
  Dene →
</Link>
        </div>

        {/* Kontroller */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Ürün ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-rose-200 rounded-full text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            />
          </div>
          <select
            value={siralama}
            onChange={(e) => setSiralama(e.target.value)}
            className="px-4 py-2.5 border border-rose-200 rounded-full text-sm focus:outline-none focus:border-rose-400 text-stone-600 bg-white cursor-pointer"
          >
            {siralamaSecenekleri.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Kategori filtreleri */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setAktifKategori('tumu')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              aktifKategori === 'tumu'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                : 'bg-rose-50 text-stone-600 hover:bg-rose-100'
            }`}
          >
            Tümü ({tumMakyajUrunleri.length})
          </button>
          {makyajKategorileri.map((kat) => {
            const sayi = tumMakyajUrunleri.filter((u) => u.altKategori === kat.id).length
            if (sayi === 0) return null
            return (
              <button
                key={kat.id}
                onClick={() => setAktifKategori(kat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  aktifKategori === kat.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                    : 'bg-rose-50 text-stone-600 hover:bg-rose-100'
                }`}
              >
                {kat.ad} ({sayi})
              </button>
            )
          })}
        </div>

        {/* Ürün grid */}
        {filtreliUrunler.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtreliUrunler.map((urun) => (
              <ProductCard key={urun.id} urun={urun} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold text-stone-700 mb-2">Ürün bulunamadı</h3>
            <p className="text-stone-400 mb-6">Arama kriterlerinizi değiştirmeyi deneyin.</p>
            <button
              onClick={() => { setAktifKategori('tumu'); setAramaMetni('') }}
              className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

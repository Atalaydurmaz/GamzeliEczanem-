'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import kategoriler from '@/data/categories'

const siralamaSecenekleri = [
  { value: 'varsayilan', label: 'Önerilen' },
  { value: 'fiyat-artan', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-azalan', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'puan', label: 'En Yüksek Puan' },
]

export default function AltKategoriSayfasi({ anaKategoriId, altKategoriSlug, apiKategori }) {
  const anaKategori = kategoriler.find((k) => k.id === anaKategoriId)
  const altKategori = anaKategori?.altKategoriler?.find((a) => {
    const parts = a.href.split('/').filter(Boolean)
    return parts[parts.length - 1] === altKategoriSlug
  })

  const [urunler, setUrunler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [siralama, setSiralama] = useState('varsayilan')
  const [aramaMetni, setAramaMetni] = useState('')

  useEffect(() => {
    if (!apiKategori) { setYukleniyor(false); return }
    fetch(`/api/products?kategori=${apiKategori}`)
      .then((r) => r.json())
      .then((d) => { setUrunler(Array.isArray(d) ? d : []); setYukleniyor(false) })
      .catch(() => setYukleniyor(false))
  }, [apiKategori])

  // altKategori.urunler[].href'lerdeki "#slug" parçaları → product.altKategori ile eşleşir
  const altHashList = useMemo(() => {
    if (!altKategori?.urunler) return []
    return altKategori.urunler
      .map((u) => u.href.split('#')[1])
      .filter(Boolean)
  }, [altKategori])

  const filtreli = useMemo(() => {
    let liste = Array.isArray(urunler) ? [...urunler] : []
    if (altHashList.length > 0) {
      const matched = liste.filter((u) => altHashList.includes(u.altKategori))
      // Veri tutarsızsa boş çıkar — bu durumda parent kategori listesini fallback göster
      if (matched.length > 0) liste = matched
    }
    if (aramaMetni.trim()) {
      const k = aramaMetni.toLowerCase()
      liste = liste.filter((u) => u.ad?.toLowerCase().includes(k) || u.aciklama?.toLowerCase().includes(k))
    }
    switch (siralama) {
      case 'fiyat-artan':  liste.sort((a, b) => a.fiyat - b.fiyat); break
      case 'fiyat-azalan': liste.sort((a, b) => b.fiyat - a.fiyat); break
      case 'puan':         liste.sort((a, b) => (b.puan ?? 0) - (a.puan ?? 0)); break
    }
    return liste
  }, [urunler, altHashList, aramaMetni, siralama])

  if (!anaKategori || !altKategori) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Kategori Bulunamadı</h1>
          <p className="text-stone-500 mb-6">Aradığınız alt kategori mevcut değil.</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
            Anasayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-purple-50 via-rose-50 to-pink-50 border-b border-rose-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-stone-500 mb-3 flex-wrap">
            <Link href="/" className="hover:text-rose-600">Anasayfa</Link>
            <span>/</span>
            <Link href={anaKategori.href} className="hover:text-rose-600">{anaKategori.label}</Link>
            <span>/</span>
            <span className="text-stone-700 font-medium">{altKategori.label}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{anaKategori.ikon}</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">{altKategori.label}</h1>
          </div>
          <p className="text-stone-500 mt-1">{filtreli.length} ürün</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!yukleniyor && urunler.length > 0 && (
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
              {siralamaSecenekleri.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}

        {yukleniyor ? (
          <div className="text-center py-20 text-stone-400">Yükleniyor...</div>
        ) : filtreli.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filtreli.map((u) => <ProductCard key={u.id} urun={u} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📦</p>
            <h3 className="text-xl font-semibold text-stone-700 mb-2">Ürünler yakında eklenecek</h3>
            <p className="text-stone-500 text-sm mb-6">Bu alt kategoride henüz ürün bulunmuyor.</p>
            <Link
              href={anaKategori.href}
              className="inline-block px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              {anaKategori.label} Sayfasına Dön
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

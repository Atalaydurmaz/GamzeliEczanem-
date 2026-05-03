'use client'

import { useState, useEffect, useMemo } from 'react'
import ProductCard from '@/components/ProductCard'
import ProductGridSkeleton from '@/components/ProductGridSkeleton'
import { ciltBakimiKategorileri } from '@/lib/data'

const siralamaSecenekleri = [
  { value: 'varsayilan', label: 'Önerilen' },
  { value: 'fiyat-artan', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-azalan', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'puan', label: 'En Yüksek Puan' },
]

export default function CiltBakimiSayfasi() {
  const [tumUrunler, setTumUrunler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifKategori, setAktifKategori] = useState('tumu')
  const [siralama, setSiralama] = useState('varsayilan')
  const [aramaMetni, setAramaMetni] = useState('')

  useEffect(() => {
    fetch('/api/products?kategori=cilt-bakimi')
      .then(r => r.json())
      .then(d => { setTumUrunler(Array.isArray(d) ? d : []); setYukleniyor(false) })
      .catch(() => setYukleniyor(false))
  }, [])

  const filtreliUrunler = useMemo(() => {
    let liste = [...tumUrunler]
    if (aktifKategori !== 'tumu') liste = liste.filter((u) => u.altKategori === aktifKategori)
    if (aramaMetni.trim()) {
      const k = aramaMetni.toLowerCase()
      liste = liste.filter((u) => u.ad.toLowerCase().includes(k) || u.aciklama?.toLowerCase().includes(k))
    }
    switch (siralama) {
      case 'fiyat-artan': liste.sort((a, b) => a.fiyat - b.fiyat); break
      case 'fiyat-azalan': liste.sort((a, b) => b.fiyat - a.fiyat); break
      case 'puan': liste.sort((a, b) => b.puan - a.puan); break
    }
    return liste
  }, [aktifKategori, siralama, aramaMetni, tumUrunler])

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-pink-50 border-b border-rose-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">✨</span>
            <h1 className="text-4xl font-bold text-stone-900">Cilt Bakımı</h1>
          </div>
          <p className="text-stone-500">Nemlendirici, serum, maske ve daha fazlası — {filtreliUrunler.length} ürün</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Ürün ara..." value={aramaMetni} onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-rose-200 rounded-full text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
          </div>
          <select value={siralama} onChange={(e) => setSiralama(e.target.value)}
            className="px-4 py-2.5 border border-rose-200 rounded-full text-sm focus:outline-none focus:border-rose-400 text-stone-600 bg-white cursor-pointer">
            {siralamaSecenekleri.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setAktifKategori('tumu')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${aktifKategori === 'tumu' ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-rose-50 text-stone-600 hover:bg-rose-100'}`}>
            Tümü ({tumUrunler.length})
          </button>
          {ciltBakimiKategorileri.map((kat) => {
            const sayi = tumUrunler.filter((u) => u.altKategori === kat.id).length
            if (sayi === 0) return null
            return (
              <button key={kat.id} onClick={() => setAktifKategori(kat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${aktifKategori === kat.id ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'bg-rose-50 text-stone-600 hover:bg-rose-100'}`}>
                {kat.ad} ({sayi})
              </button>
            )
          })}
        </div>

        {yukleniyor ? (
          <ProductGridSkeleton />
        ) : filtreliUrunler.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
            {filtreliUrunler.map((urun) => <ProductCard key={urun.id} urun={urun} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold text-stone-700 mb-2">Ürün bulunamadı</h3>
            <button onClick={() => { setAktifKategori('tumu'); setAramaMetni('') }}
              className="mt-2 px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

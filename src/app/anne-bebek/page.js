'use client'

import { useState, useEffect, useMemo } from 'react'
import ProductCard from '@/components/ProductCard'

const siralamaSecenekleri = [
  { value: 'varsayilan', label: 'Önerilen' },
  { value: 'fiyat-artan', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'fiyat-azalan', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'puan', label: 'En Yüksek Puan' },
]

export default function AnneBebek() {
  const [tumUrunler, setTumUrunler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [siralama, setSiralama] = useState('varsayilan')
  const [aramaMetni, setAramaMetni] = useState('')

  useEffect(() => {
    fetch('/api/products?kategori=anne-bebek')
      .then(r => r.json())
      .then(d => { setTumUrunler(Array.isArray(d) ? d : []); setYukleniyor(false) })
      .catch(() => setYukleniyor(false))
  }, [])

  const filtreliUrunler = useMemo(() => {
    let liste = [...tumUrunler]
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
  }, [siralama, aramaMetni, tumUrunler])

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 border-b border-rose-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🍼</span>
            <h1 className="text-4xl font-bold text-stone-900">Anne & Bebek</h1>
          </div>
          <p className="text-stone-500">Yeni doğandan itibaren hassas ciltler için — {filtreliUrunler.length} ürün</p>
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

        {filtreliUrunler.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-stone-500 font-medium">Ürün bulunamadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filtreliUrunler.map((urun) => (
              <ProductCard key={urun.id} urun={urun} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

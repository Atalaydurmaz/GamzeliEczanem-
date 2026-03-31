'use client'

import { useState } from 'react'

export default function StokBildirimButton({ urunId }) {
  const [acik, setAcik] = useState(false)
  const [email, setEmail] = useState('')
  const [durum, setDurum] = useState(null) // null | 'yukleniyor' | 'basarili' | 'zaten' | 'hata'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDurum('hata')
      return
    }
    setDurum('yukleniyor')
    try {
      const res = await fetch('/api/stok-bildirimi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urunId, email }),
      })
      const data = await res.json()
      if (data.zatenKayitli) setDurum('zaten')
      else if (data.ok) setDurum('basarili')
      else setDurum('hata')
    } catch {
      setDurum('hata')
    }
  }

  if (durum === 'basarili' || durum === 'zaten') {
    return (
      <div className="w-full py-4 px-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 text-emerald-700 font-semibold text-sm">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {durum === 'zaten' ? 'Zaten bildirim listesinde' : 'Bildirim kaydedildi!'}
      </div>
    )
  }

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="w-full py-4 px-8 rounded-full font-semibold text-sm tracking-wide border-2 border-stone-300 text-stone-600 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Stoka Girince Haber Ver
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setDurum(null) }}
          autoFocus
          className={`flex-1 px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
            durum === 'hata'
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
          }`}
        />
        <button
          type="submit"
          disabled={durum === 'yukleniyor'}
          className="px-5 py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors disabled:bg-stone-200 disabled:text-stone-400 shrink-0"
        >
          {durum === 'yukleniyor' ? '...' : 'Kaydet'}
        </button>
      </div>
      {durum === 'hata' && (
        <p className="text-xs text-red-500 pl-1">Geçerli bir e-posta adresi girin</p>
      )}
      <button
        type="button"
        onClick={() => { setAcik(false); setDurum(null) }}
        className="text-xs text-stone-400 hover:text-stone-600 pl-1 transition-colors"
      >
        İptal
      </button>
    </form>
  )
}

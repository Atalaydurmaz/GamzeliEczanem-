'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/context/CartContext'

const LS_KEY = 'gla_sepet_email'

export default function SepetEmailKayit() {
  const { sepet, toplamFiyat } = useCart()
  const [email, setEmail] = useState('')
  const [girdi, setGirdi] = useState('')
  const [durum, setDurum] = useState(null) // null | 'yukleniyor' | 'basarili' | 'hata'
  const syncTimerRef = useRef(null)

  // On mount: restore saved email and sync cart to server
  useEffect(() => {
    const kayitli = localStorage.getItem(LS_KEY)
    if (kayitli) {
      setEmail(kayitli)
      setGirdi(kayitli)
    }
  }, [])

  // Whenever cart changes and we have an email, debounce-update the server
  useEffect(() => {
    if (!email || sepet.length === 0) return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      fetch('/api/terk-sepet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sepet, toplamFiyat }),
      }).catch(() => {})
    }, 1500)
    return () => clearTimeout(syncTimerRef.current)
  }, [sepet, toplamFiyat, email])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(girdi)) {
      setDurum('hata')
      return
    }
    setDurum('yukleniyor')
    try {
      await fetch('/api/terk-sepet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: girdi, sepet, toplamFiyat }),
      })
      localStorage.setItem(LS_KEY, girdi)
      setEmail(girdi)
      setDurum('basarili')
    } catch {
      setDurum('hata')
    }
  }

  if (email && durum !== 'hata') {
    return (
      <div className="mt-4 pt-4 border-t border-rose-100 flex items-center gap-2 text-xs text-emerald-600">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Sepet {email} adresine kaydedildi
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-rose-100">
      <p className="text-xs text-stone-500 mb-2 font-medium">
        Sepetinizi kaybetmeyin — e-posta adresinizi girin:
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          placeholder="ornek@email.com"
          value={girdi}
          onChange={(e) => { setGirdi(e.target.value); setDurum(null) }}
          className={`flex-1 min-w-0 px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${
            durum === 'hata'
              ? 'border-red-300 focus:ring-red-100'
              : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
          }`}
        />
        <button
          type="submit"
          disabled={durum === 'yukleniyor'}
          className="px-3 py-2 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 transition-colors disabled:bg-stone-200 disabled:text-stone-400 shrink-0"
        >
          {durum === 'yukleniyor' ? '...' : 'Kaydet'}
        </button>
      </form>
      {durum === 'hata' && (
        <p className="mt-1 text-xs text-red-500">Geçerli bir e-posta girin</p>
      )}
    </div>
  )
}

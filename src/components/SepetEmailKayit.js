'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useSession } from 'next-auth/react'

const LS_KEY = 'gla_sepet_email'

export default function SepetEmailKayit() {
  const { sepet, toplamFiyat } = useCart()
  const { kullanici } = useAuth()
  const { data: session } = useSession()
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

  // Giriş yapmış kullanıcılara gösterme — sepetleri zaten hesaba bağlı
  if (kullanici || session?.user) return null

  if (email && durum !== 'hata') {
    return (
      <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2.5 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Sepetiniz <span className="font-semibold">{email}</span> adresine kaydedildi.</span>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-stone-100">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-700">Sepetinizi kaydedin</p>
          <p className="text-xs text-stone-400 mt-0.5">E-postanızı girin, sepetinizi kaybetmeyin.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          placeholder="ornek@email.com"
          value={girdi}
          onChange={(e) => { setGirdi(e.target.value); setDurum(null) }}
          className={`flex-1 min-w-0 px-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 transition-all ${
            durum === 'hata'
              ? 'border-red-300 focus:ring-red-100'
              : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
          }`}
        />
        <button
          type="submit"
          disabled={durum === 'yukleniyor'}
          className="px-4 py-2.5 bg-rose-500 text-white text-xs font-semibold rounded-xl hover:bg-rose-600 transition-colors disabled:bg-stone-200 disabled:text-stone-400 shrink-0"
        >
          {durum === 'yukleniyor' ? (
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'Kaydet'}
        </button>
      </form>
      {durum === 'hata' && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Geçerli bir e-posta adresi girin
        </p>
      )}
    </div>
  )
}

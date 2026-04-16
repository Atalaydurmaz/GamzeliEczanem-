'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [durum, setDurum] = useState('bos') // 'bos' | 'yukleniyor' | 'basarili' | 'hata'
  const [hataMesaji, setHataMesaji] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || durum === 'yukleniyor') return

    setDurum('yukleniyor')
    setHataMesaji('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok && data.ok) {
        setDurum('basarili')
        setEmail('')
      } else {
        setHataMesaji(data.error || 'Bir hata oluştu. Lütfen tekrar deneyin.')
        setDurum('hata')
      }
    } catch {
      setHataMesaji('Bağlantı hatası. Lütfen tekrar deneyin.')
      setDurum('hata')
    }
  }

  if (durum === 'basarili') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/30 border border-emerald-700/40 rounded-lg">
        <span className="text-emerald-400 text-lg">✓</span>
        <p className="text-sm text-emerald-300 font-medium">Abone oldunuz! Onay e-postası gönderildi.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        placeholder="E-posta adresiniz"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (durum === 'hata') setDurum('bos') }}
        className="px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-rose-400 transition-colors"
        required
      />
      {hataMesaji && (
        <p className="text-xs text-red-400">{hataMesaji}</p>
      )}
      <button
        type="submit"
        disabled={durum === 'yukleniyor' || !email}
        className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {durum === 'yukleniyor' ? 'Kaydediliyor...' : 'Abone Ol'}
      </button>
    </form>
  )
}

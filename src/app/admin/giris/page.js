'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminGirisForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [adim, setAdim]             = useState('sifre') // 'sifre' | 'otp'
  const [sifre, setSifre]           = useState('')
  const [otp, setOtp]               = useState('')
  const [hata, setHata]             = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const otpRef = useRef(null)

  useEffect(() => {
    const marker = typeof window !== 'undefined' && sessionStorage.getItem('gla_admin_session')
    if (marker !== '1') return
    fetch('/api/admin/check').then((r) => {
      if (r.ok) router.replace('/admin')
    }).catch((err) => {
      console.warn('[admin/giris] check hatası:', err?.message)
    })
  }, [router])

  // OTP adımına geçince input'a odaklan
  useEffect(() => {
    if (adim === 'otp') otpRef.current?.focus()
  }, [adim])

  async function handleSifre(e) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    const res = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sifre }),
    })

    const data = await res.json().catch(() => ({}))

    if (res.ok && data.otpGerekli) {
      setAdim('otp')
      setSifre('') // şifreyi bellekten temizle
    } else if (!res.ok) {
      setHata(data.hata || 'Hatalı şifre')
    }
    setYukleniyor(false)
  }

  async function handleOtp(e) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    const res = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ otp: otp.trim() }),
    })

    if (res.ok) {
      try { sessionStorage.setItem('gla_admin_session', '1') } catch {}
      const redirect = searchParams.get('redirect') || '/admin'
      window.location.href = redirect.startsWith('/admin') ? redirect : '/admin'
    } else {
      const data = await res.json().catch(() => ({}))
      setHata(data.hata || 'Hatalı kod')
      setOtp('')
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500 rounded-2xl mb-4 shadow-lg shadow-rose-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Admin Girişi</h1>
          <p className="text-stone-500 text-sm mt-1">GAMZELİECZANEM</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-8">
          {adim === 'sifre' ? (
            <form onSubmit={handleSifre} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value="destek@gamzelidermokozmetik.com"
                  readOnly
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-stone-50 text-stone-500 cursor-default"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Şifre</label>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="Admin şifresi"
                  autoFocus
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    hata
                      ? 'border-red-300 focus:ring-red-100'
                      : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
                  }`}
                />
                {hata && <p className="mt-1.5 text-xs text-red-500">{hata}</p>}
              </div>
              <button
                type="submit"
                disabled={yukleniyor || !sifre}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-all"
              >
                {yukleniyor ? 'Kontrol ediliyor...' : 'Devam Et'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-4">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-2xl mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-stone-600">
                  <span className="font-medium">destek@gamzelidermokozmetik.com</span> adresine<br />
                  6 haneli doğrulama kodu gönderildi.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Doğrulama Kodu</label>
                <input
                  ref={otpRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={`w-full px-4 py-3 border rounded-xl text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 transition-all ${
                    hata
                      ? 'border-red-300 focus:ring-red-100'
                      : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
                  }`}
                />
                {hata && <p className="mt-1.5 text-xs text-red-500">{hata}</p>}
                <p className="mt-1.5 text-xs text-stone-400">Kod 5 dakika geçerlidir.</p>
              </div>
              <button
                type="submit"
                disabled={yukleniyor || otp.length !== 6}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-all"
              >
                {yukleniyor ? 'Doğrulanıyor...' : 'Giriş Yap'}
              </button>
              <button
                type="button"
                onClick={() => { setAdim('sifre'); setHata(''); setOtp('') }}
                className="w-full py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                ← Şifre adımına dön
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Bu sayfa yetkisiz erişime karşı korumalıdır.
        </p>
      </div>
    </div>
  )
}

export default function AdminGiris() {
  return (
    <Suspense fallback={null}>
      <AdminGirisForm />
    </Suspense>
  )
}

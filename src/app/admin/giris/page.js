'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminGirisForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [sifre, setSifre]           = useState('')
  const [hata, setHata]             = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  // Zaten giriş yapılmışsa direkt panele yönlendir —
  // AMA sadece aynı tarayıcı oturumundaysa (sessionStorage marker varsa).
  // Browser-restore senaryosunda cookie var olsa da marker yoksa login
  // form'u göster, kullanıcı şifreyi yeniden girsin.
  useEffect(() => {
    const marker = typeof window !== 'undefined' && sessionStorage.getItem('gla_admin_session')
    if (marker !== '1') return

    fetch('/api/admin/check').then((r) => {
      if (r.ok) router.replace('/admin')
    }).catch((err) => {
      console.warn('[admin/giris] check hatası:', err?.message)
    })
  }, [router])

  async function handleSubmit(e) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    const res = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sifre }),
    })

    if (res.ok) {
      // sessionStorage marker — tarayıcı tamamen kapanınca silinir, "continue
      // where you left off" özelliği bunu geri getiremez. AdminSessionGuard
      // bu marker yoksa zorla logout yapar.
      try { sessionStorage.setItem('gla_admin_session', '1') } catch {}

      // Başarılı giriş: redirect parametresi varsa oraya, yoksa /admin'e git
      const redirect = searchParams.get('redirect') || '/admin'
      // Middleware cookie'yi artık tanıyacağından hard navigation yeterli
      window.location.href = redirect.startsWith('/admin') ? redirect : '/admin'
    } else {
      const data = await res.json().catch(() => ({}))
      setHata(data.hata || 'Hatalı şifre')
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

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-posta</label>
              <input
                type="email"
                value="destek.gamzelieczanem@gmail.com"
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
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
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

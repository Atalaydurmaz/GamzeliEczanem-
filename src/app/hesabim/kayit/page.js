'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useAuth } from '@/context/AuthContext'

export default function KayitSayfasi() {
  const { kayitOl } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ ad: '', email: '', sifre: '', sifreTekrar: '' })
  const [hatalar, setHatalar] = useState({})
  const [yukleniyor, setYukleniyor] = useState(false)
  const [googleYukleniyor, setGoogleYukleniyor] = useState(false)

  async function handleGoogle() {
    setGoogleYukleniyor(true)
    await signIn('google', { callbackUrl: '/hesabim' })
  }

  function dogrula() {
    const h = {}
    if (!form.ad.trim() || form.ad.trim().length < 2) h.ad = 'Adınızı girin'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) h.email = 'Geçerli bir e-posta girin'
    if (form.sifre.length < 6) h.sifre = 'Şifre en az 6 karakter olmalı'
    if (form.sifre !== form.sifreTekrar) h.sifreTekrar = 'Şifreler eşleşmiyor'
    return h
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const h = dogrula()
    if (Object.keys(h).length > 0) { setHatalar(h); return }
    setYukleniyor(true)
    await new Promise((r) => setTimeout(r, 600))
    const sonuc = kayitOl(form.ad.trim(), form.email, form.sifre)
    setYukleniyor(false)
    if (sonuc.basarili) router.push('/hesabim')
    else setHatalar({ genel: sonuc.hata })
  }

  function guncelle(alan, deger) {
    setForm((f) => ({ ...f, [alan]: deger }))
    if (hatalar[alan]) setHatalar((h) => ({ ...h, [alan]: '' }))
  }

  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/icon.png" alt="logo" className="w-12 h-12 object-contain mx-auto mb-3 rounded-xl" />
          </Link>
          <h1 className="text-2xl font-bold text-stone-900">Ücretsiz Hesap Oluşturun</h1>
          <p className="text-stone-500 text-sm mt-1">Özel indirimler ve sipariş takibi için kayıt olun.</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Ad Soyad *</label>
              <input
                type="text"
                placeholder="Adınız Soyadınız"
                value={form.ad}
                onChange={(e) => guncelle('ad', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hatalar.ad ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}
              />
              {hatalar.ad && <p className="mt-1 text-xs text-red-500">{hatalar.ad}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-posta *</label>
              <input
                type="email"
                placeholder="ornek@email.com"
                value={form.email}
                onChange={(e) => guncelle('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hatalar.email ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}
              />
              {hatalar.email && <p className="mt-1 text-xs text-red-500">{hatalar.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Şifre *</label>
              <input
                type="password"
                placeholder="En az 6 karakter"
                value={form.sifre}
                onChange={(e) => guncelle('sifre', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hatalar.sifre ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}
              />
              {hatalar.sifre && <p className="mt-1 text-xs text-red-500">{hatalar.sifre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Şifre Tekrar *</label>
              <input
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={form.sifreTekrar}
                onChange={(e) => guncelle('sifreTekrar', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hatalar.sifreTekrar ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}
              />
              {hatalar.sifreTekrar && <p className="mt-1 text-xs text-red-500">{hatalar.sifreTekrar}</p>}
            </div>

            {hatalar.genel && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {hatalar.genel}
              </div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {yukleniyor ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Kayıt olunuyor...
                </>
              ) : 'Kayıt Ol'}
            </button>
          </form>

          {/* Ayraç */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">veya</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Google ile Kayıt */}
          <button
            onClick={handleGoogle}
            disabled={googleYukleniyor}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 mt-4 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleYukleniyor ? (
              <svg className="animate-spin w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleYukleniyor ? 'Yönlendiriliyor...' : 'Google ile Kayıt Ol'}
          </button>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center text-sm text-stone-500">
            Zaten hesabınız var mı?{' '}
            <Link href="/hesabim/giris" className="text-rose-600 font-semibold hover:underline">
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

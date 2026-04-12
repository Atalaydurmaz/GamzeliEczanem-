'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SifremiUnuttumSayfasi() {
  const router = useRouter()
  const [adim, setAdim] = useState(1) // 1: email, 2: otp kodu, 3: yeni şifre
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [devOtp, setDevOtp] = useState('') // yalnızca geliştirme ortamında

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email) { setHata('E-posta adresinizi girin.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setHata('Geçerli bir e-posta girin.'); return }
    setYukleniyor(true)
    setHata('')
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.basarili) {
        setHata(data.hata)
        return
      }
      // Geliştirme ortamında OTP otomatik gelir
      if (data.dev_otp) setDevOtp(data.dev_otp)
      setAdim(2)
    } catch {
      setHata('Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault()
    if (!otp.trim()) { setHata('Doğrulama kodunu girin.'); return }
    // Gerçek doğrulama bir sonraki adımda API'da yapılır; burada sadece adımı ilerlet
    setHata('')
    setAdim(3)
  }

  async function handleSifreSubmit(e) {
    e.preventDefault()
    if (!yeniSifre || !yeniSifreTekrar) { setHata('Tüm alanları doldurun.'); return }
    const SIFRE_RE = /^(?=.*[a-zA-ZğüşıöçĞÜŞİÖÇ])(?=.*\d).{8,32}$/
    if (!SIFRE_RE.test(yeniSifre)) { setHata('Şifreniz 8-32 karakter arasında olmalı, en az bir harf ve rakam içermelidir.'); return }
    if (yeniSifre !== yeniSifreTekrar) { setHata('Şifreler eşleşmiyor.'); return }
    setYukleniyor(true)
    setHata('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp.trim(), yeniSifre }),
      })
      const data = await res.json()
      if (data.basarili) {
        router.push('/hesabim/giris?mesaj=sifre-sifirlandi')
      } else {
        setHata(data.hata)
        // Geçersiz token → OTP adımına geri dön
        if (res.status === 401) setAdim(2)
      }
    } catch {
      setHata('Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/icon.png" alt="logo" className="w-12 h-12 object-contain mx-auto mb-3 rounded-xl" />
          </Link>
          <h1 className="text-2xl font-bold text-stone-900">Şifremi Unuttum?</h1>
          <p className="text-stone-500 text-sm mt-1">
            {adim === 1 && 'Kayıtlı e-posta adresinizi girin.'}
            {adim === 2 && 'E-postanıza gönderilen kodu girin.'}
            {adim === 3 && 'Yeni şifrenizi belirleyin.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8">

          {/* Adım göstergesi */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1.5 rounded-full ${adim >= 1 ? 'bg-rose-500' : 'bg-stone-200'}`} />
            <div className={`flex-1 h-1.5 rounded-full ${adim >= 2 ? 'bg-rose-500' : 'bg-stone-200'}`} />
            <div className={`flex-1 h-1.5 rounded-full ${adim >= 3 ? 'bg-rose-500' : 'bg-stone-200'}`} />
          </div>

          {adim === 1 && (
            <form onSubmit={handleEmailSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">E-posta</label>
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setHata('') }}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>

              {hata && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{hata}</div>
              )}

              <button
                type="submit"
                disabled={yukleniyor}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {yukleniyor ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Kontrol ediliyor...</> : 'Devam Et'}
              </button>
            </form>
          )}

          {adim === 2 && (
            <form onSubmit={handleOtpSubmit} noValidate className="space-y-5">
              <div className="bg-rose-50 rounded-xl px-4 py-3 text-sm text-stone-600">
                <span className="font-medium">{email}</span> adresine 6 haneli doğrulama kodu gönderdik.
              </div>

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  🧪 Geliştirme modu — Kod: <strong className="font-mono text-base">{devOtp}</strong>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Doğrulama Kodu</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setHata('') }}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-center font-mono text-xl tracking-widest focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>

              {hata && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{hata}</div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all"
              >
                Kodu Doğrula
              </button>

              <button
                type="button"
                onClick={() => { setAdim(1); setOtp(''); setDevOtp(''); setHata('') }}
                className="w-full py-2.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Farklı e-posta kullan
              </button>
            </form>
          )}

          {adim === 3 && (
            <form onSubmit={handleSifreSubmit} noValidate className="space-y-5">
              <div className="bg-rose-50 rounded-xl px-4 py-3 text-sm text-stone-600 mb-2">
                <span className="font-medium">Hesap:</span> {email}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  placeholder="8-32 karakter, harf ve rakam içermeli"
                  value={yeniSifre}
                  onChange={(e) => { setYeniSifre(e.target.value); setHata('') }}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Yeni Şifre Tekrar</label>
                <input
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  value={yeniSifreTekrar}
                  onChange={(e) => { setYeniSifreTekrar(e.target.value); setHata('') }}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>

              {hata && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{hata}</div>
              )}

              <button
                type="submit"
                disabled={yukleniyor}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {yukleniyor ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Kaydediliyor...</> : 'Şifremi Güncelle'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-stone-100 text-center text-sm text-stone-500">
            <Link href="/hesabim/giris" className="text-rose-600 font-semibold hover:underline">
              Girişe Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

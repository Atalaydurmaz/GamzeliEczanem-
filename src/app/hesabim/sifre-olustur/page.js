'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SifreOlustur() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setHata('')
    const SIFRE_RE = /^(?=.*[a-zA-ZğüşıöçĞÜŞİÖÇ])(?=.*\d).{8,32}$/
    if (!SIFRE_RE.test(sifre)) { setHata('Şifreniz 8-32 karakter arasında olmalı, en az bir harf ve rakam içermelidir.'); return }
    if (sifre !== sifreTekrar) { setHata('Şifreler eşleşmiyor.'); return }

    const email = session?.user?.email
    if (!email) { setHata('Oturum bilgisi alınamadı. Lütfen sayfayı yenileyin.'); return }

    setYukleniyor(true)
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, yeniSifre: sifre }),
      })
      const data = await res.json()

      if (data.basarili) {
        // Session'daki sifreKurulumu bayrağını temizle (döngüyü önle)
        await update({ sifreKurulumu: false })
        router.push('/hesabim?mesaj=sifre-olusturuldu')
      } else {
        setHata(data.hata || 'Bir hata oluştu. Lütfen tekrar deneyin.')
      }
    } catch {
      setHata('Bağlantı hatası oluştu. Lütfen tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><img src="/icon.png" alt="logo" className="w-12 h-12 object-contain mx-auto mb-3 rounded-xl" /></Link>
          <h1 className="text-2xl font-bold text-stone-900">Şifre Oluşturun</h1>
          <p className="text-stone-500 text-sm mt-1">
            Google hesabınıza ek olarak e-posta/şifre ile de giriş yapabilmek için bir şifre belirleyin.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8">
          {session?.user?.email && (
            <div className="bg-rose-50 rounded-xl px-4 py-3 mb-5 text-sm text-stone-600">
              <span className="font-medium">Hesap:</span> {session.user.email}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Yeni Şifre</label>
              <input
                type="password"
                placeholder="8-32 karakter, harf ve rakam içermeli"
                value={sifre}
                onChange={(e) => { setSifre(e.target.value); setHata('') }}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Şifre Tekrar</label>
              <input
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={sifreTekrar}
                onChange={(e) => { setSifreTekrar(e.target.value); setHata('') }}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>

            {hata && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
                ⚠️ {hata}
              </div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {yukleniyor ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Kaydediliyor...
                </>
              ) : 'Şifremi Kaydet'}
            </button>

            <button
              type="button"
              onClick={async () => {
                await update({ sifreKurulumu: false })
                router.push('/hesabim')
              }}
              className="w-full py-3 text-stone-400 text-sm hover:text-stone-600 transition-colors"
            >
              Şimdi değil, geç
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

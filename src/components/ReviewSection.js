'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useAuth } from '@/context/AuthContext'
import { useReviews } from '@/context/ReviewContext'

function Yildizlar({ puan, boyut = 'w-5 h-5', interactive = false, onSelect }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((y) => (
        <svg
          key={y}
          className={`${boyut} transition-colors ${
            y <= (interactive ? hover || puan : puan) ? 'text-amber-400' : 'text-stone-200'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          onClick={() => interactive && onSelect?.(y)}
          onMouseEnter={() => interactive && setHover(y)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewForm({ urunId, onYorum }) {
  const { kullanici, yukleniyor: authYukleniyor } = useAuth()
  const { data: session, status: sessionStatus } = useSession()
  const { refreshStats } = useReviews()
  const [puan, setPuan] = useState(0)
  const [yorum, setYorum] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [basarili, setBasarili] = useState(false)
  const [fotolar, setFotolar] = useState([]) // uploaded URLs
  const [fotoYukleniyor, setFotoYukleniyor] = useState(false)

  const aktifKullanici = kullanici || (session?.user ? { ad: session.user.name || session.user.email } : null)
  const authKontrolEdiliyor = authYukleniyor || sessionStatus === 'loading'

  if (authKontrolEdiliyor) {
    return (
      <div className="bg-white border border-rose-100 rounded-2xl p-6 flex items-center justify-center h-24">
        <div className="animate-spin w-5 h-5 border-4 border-rose-200 border-t-rose-500 rounded-full" />
      </div>
    )
  }

  if (!aktifKullanici) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
        <p className="text-stone-600 mb-3">Yorum yapmak için giriş yapmalısınız.</p>
        <Link
          href="/hesabim"
          className="inline-block px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-full transition-colors"
        >
          Giriş Yap
        </Link>
      </div>
    )
  }

  async function handleFotoSec(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (fotolar.length + files.length > 3) {
      setHata('En fazla 3 fotoğraf ekleyebilirsiniz')
      return
    }
    setFotoYukleniyor(true)
    setHata('')
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const fd = new FormData()
        fd.append('foto', file)
        const res = await fetch('/api/reviews/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Yükleme hatası')
        }
        const { url } = await res.json()
        return url
      }))
      setFotolar((prev) => [...prev, ...urls])
    } catch (err) {
      setHata(err.message)
    }
    setFotoYukleniyor(false)
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (puan === 0) { setHata('Lütfen bir puan seçin'); return }
    if (yorum.trim().length < 10) { setHata('Yorum en az 10 karakter olmalı'); return }
    setHata('')
    setYukleniyor(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urunId, kullaniciAd: aktifKullanici.ad, puan, yorum, fotolar }),
      })
      if (!res.ok) { setHata('Yorum gönderilemedi'); setYukleniyor(false); return }
      const yeniYorum = await res.json()
      setBasarili(true)
      setYorum('')
      setPuan(0)
      setFotolar([])
      onYorum(yeniYorum)
      refreshStats()
    } catch {
      setHata('Bir hata oluştu')
    }
    setYukleniyor(false)
  }

  return (
    <div className="bg-white border border-rose-100 rounded-2xl p-6">
      <h3 className="text-base font-bold text-stone-900 mb-4">Yorum Yaz</h3>
      {basarili && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
          ✅ Yorumunuz eklendi, teşekkürler!
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">Puanınız *</p>
          <Yildizlar puan={puan} boyut="w-8 h-8" interactive onSelect={setPuan} />
          {puan > 0 && (
            <p className="text-xs text-stone-400 mt-1">
              {['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'][puan]}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Yorumunuz * <span className="text-stone-400 font-normal">(min. 10 karakter)</span>
          </label>
          <textarea
            rows={4}
            value={yorum}
            onChange={(e) => { setYorum(e.target.value); setHata('') }}
            placeholder="Bu ürün hakkında düşüncelerinizi paylaşın..."
            className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
          />
          <div className="flex justify-between mt-1">
            {hata ? <p className="text-xs text-red-500">{hata}</p> : <span />}
            <p className="text-xs text-stone-400">{yorum.length} karakter</p>
          </div>
        </div>

        {/* Fotoğraf yükleme */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-2">
            Fotoğraf Ekle <span className="text-stone-400 font-normal">(isteğe bağlı, maks. 3)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {fotolar.map((url, i) => (
              <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-rose-100 group">
                <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFotolar((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {fotolar.length < 3 && (
              <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors ${fotoYukleniyor ? 'opacity-50 pointer-events-none' : ''}`}>
                {fotoYukleniyor ? (
                  <div className="animate-spin w-5 h-5 border-2 border-rose-200 border-t-rose-500 rounded-full" />
                ) : (
                  <>
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-rose-400">Ekle</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFotoSec}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-400">
            Yorum yapan: <span className="font-medium text-stone-600">{aktifKullanici.ad}</span>
          </p>
          <button
            type="submit"
            disabled={yukleniyor || fotoYukleniyor}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white text-sm font-semibold rounded-full transition-all"
          >
            {yukleniyor ? 'Gönderiliyor...' : 'Yorum Gönder'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ReviewSection({ urunId, urunPuan, urunYorumSayisi }) {
  const [yorumlar, setYorumlar] = useState(null) // null = loading

  useEffect(() => {
    fetch(`/api/reviews?urunId=${urunId}`)
      .then((r) => r.json())
      .then(setYorumlar)
      .catch(() => setYorumlar([]))
  }, [urunId])

  function handleYeniYorum(yeniYorum) {
    setYorumlar((prev) => [yeniYorum, ...(prev ?? [])])
  }

  // Hesapla: gerçek yorumlar varsa onları kullan, yoksa static
  const gercekYorumlar = yorumlar ?? []
  const gercekSayi = gercekYorumlar.length
  const gercekPuan = gercekSayi > 0
    ? Math.round((gercekYorumlar.reduce((a, r) => a + r.puan, 0) / gercekSayi) * 10) / 10
    : urunPuan
  const toplamSayi = gercekSayi > 0 ? gercekSayi : urunYorumSayisi

  // Dağılım
  const dagilim = [5, 4, 3, 2, 1].map((y) => ({
    yildiz: y,
    sayi: gercekYorumlar.filter((r) => r.puan === y).length,
    yuzde: gercekSayi > 0
      ? Math.round((gercekYorumlar.filter((r) => r.puan === y).length / gercekSayi) * 100)
      : 0,
  }))

  return (
    <section className="py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-stone-900 mb-8">Müşteri Yorumları</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol: Özet + Form */}
          <div className="space-y-6">
            {/* Puan özeti */}
            <div className="bg-white border border-rose-100 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-6xl font-black text-stone-900 leading-none mb-1">{gercekPuan.toFixed(1)}</p>
              <Yildizlar puan={Math.round(gercekPuan)} boyut="w-6 h-6" />
              <p className="text-sm text-stone-400 mt-2">{toplamSayi} yorum</p>

              {gercekSayi > 0 && (
                <div className="mt-4 space-y-1.5 text-left">
                  {dagilim.map((d) => (
                    <div key={d.yildiz} className="flex items-center gap-2 text-xs">
                      <span className="text-stone-500 w-3 text-right">{d.yildiz}</span>
                      <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${d.yuzde}%` }}
                        />
                      </div>
                      <span className="text-stone-400 w-6">{d.sayi}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yorum formu */}
            <ReviewForm urunId={urunId} onYorum={handleYeniYorum} />
          </div>

          {/* Sağ: Yorumlar listesi */}
          <div className="lg:col-span-2">
            {yorumlar === null ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" />
              </div>
            ) : gercekYorumlar.length === 0 ? (
              <div className="bg-white border border-rose-100 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-stone-500 font-medium">Henüz yorum yok</p>
                <p className="text-stone-400 text-sm mt-1">Bu ürünü ilk yorumlayan siz olun!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gercekYorumlar.map((r) => (
                  <div key={r.id} className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-rose-500 font-bold text-sm">
                            {r.kullaniciAd.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-800">{r.kullaniciAd}</p>
                          <p className="text-xs text-stone-400">
                            {new Date(r.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <Yildizlar puan={r.puan} boyut="w-4 h-4" />
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">{r.yorum}</p>
                    {r.fotolar?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {r.fotolar.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="block w-20 h-20 rounded-xl overflow-hidden border border-rose-100 hover:opacity-90 transition-opacity shrink-0">
                            <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

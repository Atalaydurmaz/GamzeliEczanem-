'use client'

import { useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { urunler } from '@/lib/data'

const SORULAR = [
  {
    id: 'ciltTipi',
    soru: 'Cilt tipiniz nedir?',
    aciklama: 'Cildinizi en iyi tanımlayan seçeneği işaretleyin.',
    secenekler: [
      { deger: 'Yağlı', ikon: '💧', aciklama: 'Parlak görünüm, gözenek sorunu' },
      { deger: 'Kuru', ikon: '🏜️', aciklama: 'Sıkışma hissi, pul pul dökülme' },
      { deger: 'Karma', ikon: '⚖️', aciklama: 'T bölgesi yağlı, yanaklar kuru' },
      { deger: 'Normal', ikon: '✨', aciklama: 'Dengeli ve sorunsuz cilt' },
      { deger: 'Hassas', ikon: '🌸', aciklama: 'Kızarıklık ve tahriş eğilimli' },
    ],
  },
  {
    id: 'sorun',
    soru: 'En büyük cilt sorununuz nedir?',
    aciklama: 'Size en çok rahatsızlık veren sorunu seçin.',
    secenekler: [
      { deger: 'Akne', ikon: '🔴', aciklama: 'Sivilce ve siyah nokta' },
      { deger: 'Leke', ikon: '🟤', aciklama: 'Güneş veya post-akne lekesi' },
      { deger: 'Kırışıklık', ikon: '〰️', aciklama: 'İnce çizgiler ve yaşlanma' },
      { deger: 'Kuruluk', ikon: '❄️', aciklama: 'Nem eksikliği, çekilme hissi' },
      { deger: 'Gözenek', ikon: '🔍', aciklama: 'Büyük ve belirgin gözenekler' },
    ],
  },
  {
    id: 'yas',
    soru: 'Yaş grubunuz nedir?',
    aciklama: 'Yaşınıza uygun formüller önerebilmemiz için.',
    secenekler: [
      { deger: '18-25', ikon: '🌱', aciklama: 'Koruyucu ve hafif bakım' },
      { deger: '26-35', ikon: '🌿', aciklama: 'Önleyici anti-aging başlangıcı' },
      { deger: '36-45', ikon: '🌳', aciklama: 'Yoğun onarım ve sıkılaştırma' },
      { deger: '46+', ikon: '🌺', aciklama: 'Güçlü anti-aging ve nem' },
    ],
  },
  {
    id: 'rutin',
    soru: 'Cilt bakım rutininiz var mı?',
    aciklama: 'Mevcut bakım alışkanlıklarınızı seçin.',
    secenekler: [
      { deger: 'Hayır, yeni başlıyorum', ikon: '🌱', aciklama: 'Temel ürünlerle başla' },
      { deger: 'Temel rutin var', ikon: '🧴', aciklama: 'Temizleyici + nemlendirici kullanıyorum' },
      { deger: 'Detaylı rutin var', ikon: '💎', aciklama: 'Serum, tonik, göz kremi kullanıyorum' },
    ],
  },
  {
    id: 'butce',
    soru: 'Bütçeniz nedir?',
    aciklama: 'Ürün önerilerini bütçenize göre kişiselleştirelim.',
    secenekler: [
      { deger: 'Ekonomik', ikon: '💰', aciklama: 'Uygun fiyatlı, kaliteli seçenekler' },
      { deger: 'Orta', ikon: '💳', aciklama: 'Fiyat-performans dengesi' },
      { deger: 'Premium', ikon: '👑', aciklama: 'En etkili ürünler, fiyat önemsiz' },
    ],
  },
]

export default function CiltAnaliziPage() {
  const [adim, setAdim] = useState(0)
  const [cevaplar, setCevaplar] = useState({})
  const [fase, setFase] = useState('quiz') // 'quiz' | 'yukleniyor' | 'sonuc' | 'hata'
  const [sonuc, setSonuc] = useState(null)
  const [hata, setHata] = useState(null)

  const mevcutSoru = SORULAR[adim]
  const secili = mevcutSoru ? (cevaplar[mevcutSoru.id] ?? null) : null
  const toplamAdim = SORULAR.length
  const ilerleme = Math.round((adim / toplamAdim) * 100)

  function secimYap(deger) {
    setCevaplar((prev) => ({ ...prev, [mevcutSoru.id]: deger }))
  }

  function ileri() {
    if (!secili) return
    if (adim + 1 >= toplamAdim) {
      analiz(cevaplar)
    } else {
      setAdim(adim + 1)
    }
  }

  function geri() {
    if (adim > 0) setAdim(adim - 1)
  }

  async function analiz(cevaplarData) {
    setFase('yukleniyor')
    setHata(null)
    try {
      const res = await fetch('/api/cilt-analizi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cevaplarData),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'API hatası')
      setSonuc(data)
      setFase('sonuc')
    } catch (e) {
      setHata(e.message)
      setFase('hata')
    }
  }

  function yenidenBasla() {
    setAdim(0)
    setCevaplar({})
    setFase('quiz')
    setSonuc(null)
    setHata(null)
  }

  // ── Yükleniyor ────────────────────────────────────────────────────────────
  if (fase === 'yukleniyor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl animate-spin" style={{ animationDuration: '3s' }}>🔬</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">Cilt Analiziniz Hazırlanıyor</h2>
          <p className="text-stone-500 max-w-xs mx-auto">
            Profilinize özel ürün önerileri ve bakım rutini oluşturuluyor...
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Hata ──────────────────────────────────────────────────────────────────
  if (fase === 'hata') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 max-w-sm w-full text-center shadow-xl border border-rose-100">
          <span className="text-5xl block mb-4">😔</span>
          <h2 className="text-xl font-bold text-stone-800 mb-2">Bir sorun oluştu</h2>
          <p className="text-stone-500 text-sm mb-6">{hata}</p>
          <button
            onClick={yenidenBasla}
            className="px-6 py-3 bg-rose-500 text-white rounded-full font-semibold hover:bg-rose-600 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  // ── Sonuç ─────────────────────────────────────────────────────────────────
  if (fase === 'sonuc' && sonuc) {
    const onerilenUrunler = (sonuc.urunIdleri || [])
      .map((id) => urunler.find((u) => u.id === id))
      .filter(Boolean)

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Başlık */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">✨</span>
            </div>
            <h1 className="text-3xl font-black text-stone-900 mb-2">Cilt Analiziniz Hazır!</h1>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[cevaplar.ciltTipi, cevaplar.sorun, cevaplar.yas, cevaplar.butce].map((c) => (
                <span key={c} className="text-xs px-3 py-1 bg-white border border-rose-200 text-rose-600 rounded-full font-medium shadow-sm">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Analiz Kartı */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 mb-5">
            <h2 className="text-base font-bold text-stone-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-sm">🧬</span>
              Uzman Cilt Analizi
            </h2>
            <p className="text-stone-600 leading-relaxed text-sm">{sonuc.analiz}</p>
          </div>

          {/* Rutin Kartı */}
          <div className="bg-rose-500 rounded-2xl p-6 shadow-sm mb-8 text-white">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">📋</span>
              Önerilen Bakım Rutini
            </h2>
            <p className="leading-relaxed text-sm opacity-95">{sonuc.rutin}</p>
          </div>

          {/* Ürün Önerileri */}
          {onerilenUrunler.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-stone-900 mb-2">Size Özel Ürün Önerileri</h2>
              <p className="text-stone-400 text-sm mb-6">Cilt profilinize en uygun {onerilenUrunler.length} ürün seçildi.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {onerilenUrunler.map((urun) => (
                  <ProductCard key={urun.id} urun={urun} />
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={yenidenBasla}
              className="px-8 py-3 bg-white text-rose-600 rounded-full font-semibold hover:bg-rose-50 transition-colors shadow-md border border-rose-200"
            >
              Yeniden Analiz Yap
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
      <div className="max-w-xl mx-auto px-4 py-12">

        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🔬</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 mb-2">AI Cilt Analizi</h1>
          <p className="text-stone-500 text-sm">5 soruda kişisel cilt profilinizi oluşturun, size özel ürün önerisi alın.</p>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-stone-400 mb-2">
            <span>Soru {adim + 1} / {toplamAdim}</span>
            <span>%{ilerleme}</span>
          </div>
          <div className="h-2 bg-rose-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${ilerleme}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {SORULAR.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < adim ? 'bg-rose-500' : i === adim ? 'bg-rose-400 scale-125' : 'bg-rose-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Soru Kartı */}
        <div className="bg-white rounded-2xl p-7 shadow-sm border border-rose-100">
          <h2 className="text-xl font-bold text-stone-900 mb-1">{mevcutSoru.soru}</h2>
          <p className="text-sm text-stone-400 mb-6">{mevcutSoru.aciklama}</p>

          <div className="space-y-3">
            {mevcutSoru.secenekler.map((secenek) => (
              <button
                key={secenek.deger}
                onClick={() => secimYap(secenek.deger)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-150 text-left group ${
                  secili === secenek.deger
                    ? 'border-rose-500 bg-rose-50 shadow-sm'
                    : 'border-stone-200 hover:border-rose-200 hover:bg-rose-50/40'
                }`}
              >
                <span className="text-2xl shrink-0">{secenek.ikon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${secili === secenek.deger ? 'text-rose-700' : 'text-stone-800'}`}>
                    {secenek.deger}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">{secenek.aciklama}</p>
                </div>
                <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  secili === secenek.deger
                    ? 'border-rose-500 bg-rose-500'
                    : 'border-stone-300 group-hover:border-rose-300'
                }`}>
                  {secili === secenek.deger && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Navigasyon */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={geri}
              className={`flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors px-2 py-1 rounded-lg hover:bg-stone-50 ${adim === 0 ? 'invisible' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>

            <button
              onClick={ileri}
              disabled={!secili}
              className="flex items-center gap-2 px-8 py-3 bg-rose-500 text-white text-sm font-semibold rounded-full hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {adim + 1 === toplamAdim ? (
                <>
                  <span>Analiz Et</span>
                  <span>✨</span>
                </>
              ) : (
                <>
                  <span>Devam</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Alt bilgi */}
        <p className="text-center text-xs text-stone-400 mt-6">
          🔒 Bilgileriniz yalnızca kişisel öneri için kullanılır, kayıt edilmez.
        </p>
      </div>
    </div>
  )
}

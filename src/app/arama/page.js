'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import { urunler } from '@/lib/data'

const ORNEKLER = [
  'kuru cilt için nemlendirici',
  'akne için serum',
  'hassas cilt bakımı',
  'güneş lekesi için krem',
  'saç dökülmesi için şampuan',
  'gözenek sıkılaştırıcı maske',
]

function AramaIcerigi() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sorgu = searchParams.get('q') || ''
  const gorselArama = searchParams.get('gorsel') === '1'

  const [inputDeger, setInputDeger] = useState(sorgu)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [sonuc, setSonuc] = useState(null)
  const [hata, setHata] = useState(null)
  const oncekiSorgu = useRef(null)

  useEffect(() => {
    // Görsel arama sonucu sessionStorage'dan yükle
    if (gorselArama) {
      try {
        const kayitli = sessionStorage.getItem('gorsel-arama-sonuc')
        if (kayitli) {
          setSonuc(JSON.parse(kayitli))
          setInputDeger('')
          return
        }
      } catch {}
    }
    setInputDeger(sorgu)
    if (sorgu && sorgu !== oncekiSorgu.current) {
      oncekiSorgu.current = sorgu
      ara(sorgu)
    }
    if (!sorgu) {
      setSonuc(null)
      setHata(null)
    }
  }, [sorgu, gorselArama])

  async function ara(s) {
    setYukleniyor(true)
    setSonuc(null)
    setHata(null)
    try {
      const res = await fetch('/api/arama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sorgu: s }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setSonuc(data)
    } catch (e) {
      setHata(e.message)
    } finally {
      setYukleniyor(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const q = inputDeger.trim()
    if (!q) return
    if (q === sorgu) {
      ara(q)
    } else {
      router.push(`/arama?q=${encodeURIComponent(q)}`)
    }
  }

  const onerilenUrunler = sonuc
    ? (sonuc.urunIdleri || []).map((id) => urunler.find((u) => u.id === id)).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sabit Arama Başlığı */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={inputDeger}
                onChange={(e) => setInputDeger(e.target.value)}
                placeholder="Neye ihtiyacınız var? Doğal Türkçe yazın..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-gray-50 focus:bg-white"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!inputDeger.trim() || yukleniyor}
              className="px-6 py-3 bg-rose-500 text-white text-sm font-semibold rounded-full hover:bg-rose-600 disabled:opacity-40 transition-colors shrink-0"
            >
              {yukleniyor ? '...' : 'Ara'}
            </button>
          </form>

          {/* Örnek Sorgular — sadece arama yokken göster */}
          {!sorgu && (
            <p className="text-xs text-gray-400 mt-2 pl-4">
              Örnek: kuru cilt için nemlendirici, akne için serum, hassas cilt bakımı
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Boş Durum — henüz arama yapılmadı */}
        {!sorgu && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">AI Destekli Akıllı Arama</h2>
            <p className="text-stone-400 text-sm mb-8 max-w-sm mx-auto">
              Doğal Türkçe ile ihtiyacınızı yazın, yapay zeka size en uygun ürünleri önersin.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {ORNEKLER.map((ornek) => (
                <button
                  key={ornek}
                  onClick={() => router.push(`/arama?q=${encodeURIComponent(ornek)}`)}
                  className="px-4 py-2 bg-white border border-rose-200 text-rose-600 text-sm rounded-full hover:bg-rose-50 transition-colors shadow-sm"
                >
                  {ornek}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Yükleniyor */}
        {yukleniyor && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-3xl animate-spin" style={{ animationDuration: '2s' }}>✨</span>
            </div>
            <p className="text-stone-600 font-medium mb-1">AI analiz ediyor...</p>
            <p className="text-stone-400 text-sm">
              &ldquo;{sorgu}&rdquo; için en uygun ürünler aranıyor
            </p>
          </div>
        )}

        {/* Hata */}
        {hata && !yukleniyor && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">😔</span>
            <p className="text-stone-500">Bir hata oluştu. Lütfen tekrar deneyin.</p>
          </div>
        )}

        {/* Sonuçlar */}
        {sonuc && !yukleniyor && (
          <>
            {/* AI Açıklaması */}
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 mb-7">
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white text-sm shrink-0 mt-0.5">
                🤖
              </div>
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wide mb-1">AI Analizi</p>
                <p className="text-sm text-stone-700 leading-relaxed">{sonuc.aciklama}</p>
              </div>
            </div>

            {onerilenUrunler.length > 0 ? (
              <>
                <p className="text-sm text-stone-400 mb-5">
                  {gorselArama ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-stone-700">
                      <span>📷</span> Görsel aramanız
                    </span>
                  ) : (
                    <span className="font-semibold text-stone-700">&ldquo;{sorgu}&rdquo;</span>
                  )}{' '}
                  için {onerilenUrunler.length} ürün önerildi
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {onerilenUrunler.map((urun) => (
                    <ProductCard key={urun.id} urun={urun} />
                  ))}
                </div>

                {/* Örnek Sorgular — sonuç sonrasında alternatif öneriler */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <p className="text-sm text-stone-400 mb-4 text-center">Başka bir şey aramak ister misiniz?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {ORNEKLER.filter((o) => o !== sorgu).slice(0, 4).map((ornek) => (
                      <button
                        key={ornek}
                        onClick={() => router.push(`/arama?q=${encodeURIComponent(ornek)}`)}
                        className="px-4 py-2 bg-white border border-gray-200 text-stone-500 text-sm rounded-full hover:border-rose-200 hover:text-rose-600 transition-colors"
                      >
                        {ornek}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-stone-400 mb-2">Bu arama için uygun ürün bulunamadı.</p>
                <p className="text-sm text-stone-300">Farklı bir arama terimi deneyin.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AramaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl block mb-3 animate-pulse">🔍</span>
            <p className="text-stone-400 text-sm">Yükleniyor...</p>
          </div>
        </div>
      }
    >
      <AramaIcerigi />
    </Suspense>
  )
}

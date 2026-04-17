'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useStock } from '@/context/StockContext'
import { useAuth } from '@/context/AuthContext'
import { useSession } from 'next-auth/react'
import SepetEmailKayit from '@/components/SepetEmailKayit'

const UYE_INDIRIMI_ORANI = 0.05 // %5 üye indirimi

export default function SepetSayfasi() {
  const { sepet, sepeteEkle, sepettenCikar, adediGuncelle, toplamFiyat, kargoUcreti, toplamAdet, hydrated } = useCart()
  const { getKalanStok } = useStock()
  const { kullanici } = useAuth()
  const { data: session } = useSession()
  const girisYapti = !!(kullanici || session?.user)
  const uyeIndirimi = girisYapti ? Math.round(toplamFiyat * UYE_INDIRIMI_ORANI) : 0

  const [indirimGirisi, setIndirimGirisi] = useState('')
  const [indirimKodu, setIndirimKodu] = useState('')
  const [indirimTutari, setIndirimTutari] = useState(0)
  const [indirimHata, setIndirimHata] = useState('')
  const [indirimYukleniyor, setIndirimYukleniyor] = useState(false)

  // iyzico 3DS flow'dan geri dönüldüğünde kurtarma snapshot'ı
  const [odemeSnapshot, setOdemeSnapshot] = useState(null)
  useEffect(() => {
    if (!hydrated) return
    try {
      const raw = sessionStorage.getItem('gec_odeme_snapshot')
      if (!raw) return
      const snapshot = JSON.parse(raw)
      // Süresi dolmuşsa sil
      if (snapshot.expiresAt < Date.now()) {
        sessionStorage.removeItem('gec_odeme_snapshot')
        return
      }
      // Sepet doluysa snapshot'a gerek yok (kullanıcı yeni ürün eklemiş olabilir)
      if (sepet.length > 0) {
        sessionStorage.removeItem('gec_odeme_snapshot')
        return
      }
      setOdemeSnapshot(snapshot)
    } catch {}
  }, [hydrated, sepet.length])

  function snapshotGeriYukle() {
    if (!odemeSnapshot?.sepet) return
    // Her ürünü bir kez ekle (adet=1), sonra adet güncelle
    odemeSnapshot.sepet.forEach((item) => {
      sepeteEkle({ ...item, adet: 1 })
      if (item.adet > 1) adediGuncelle(item.id, item.adet)
    })
    sessionStorage.removeItem('gec_odeme_snapshot')
    setOdemeSnapshot(null)
  }

  function snapshotReddet() {
    sessionStorage.removeItem('gec_odeme_snapshot')
    setOdemeSnapshot(null)
  }

  async function indirimUygula() {
    if (!indirimGirisi.trim()) return
    setIndirimHata('')
    setIndirimYukleniyor(true)
    try {
      const res = await fetch('/api/indirim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kod: indirimGirisi.trim(), toplamFiyat }),
      })
      const data = await res.json()
      if (data.gecerli) {
        setIndirimKodu(data.kod)
        setIndirimTutari(data.indirimTutari)
      } else {
        setIndirimHata(data.hata)
        setIndirimKodu('')
        setIndirimTutari(0)
      }
    } catch {
      setIndirimHata('Bağlantı hatası, tekrar deneyin')
    } finally {
      setIndirimYukleniyor(false)
    }
  }

  function indirimKaldir() {
    setIndirimKodu('')
    setIndirimTutari(0)
    setIndirimGirisi('')
    setIndirimHata('')
  }

  // Sepet toplamı değişince aktif kuponu yeniden doğrula
  const oncekiToplamRef = useRef(toplamFiyat)
  useEffect(() => {
    if (!indirimKodu || toplamFiyat === oncekiToplamRef.current) {
      oncekiToplamRef.current = toplamFiyat
      return
    }
    oncekiToplamRef.current = toplamFiyat
    fetch('/api/indirim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kod: indirimKodu, toplamFiyat }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.gecerli) {
          setIndirimTutari(data.indirimTutari)
          setIndirimHata('')
        } else {
          setIndirimKodu('')
          setIndirimTutari(0)
          setIndirimGirisi('')
          setIndirimHata(data.hata || 'Kupon bu sepet için artık geçerli değil, kaldırıldı.')
        }
      })
      .catch(() => {})
  }, [toplamFiyat, indirimKodu])

  if (sepet.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white px-4">

        {/* 3DS'den geri dönüldüyse kurtarma banner'ı */}
        {odemeSnapshot && (
          <div className="w-full max-w-md mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-stone-800 mb-1">Devam eden bir ödeme işleminiz var</p>
                <p className="text-sm text-stone-600 mb-3">
                  Banka sayfasından geri döndünüz. Ödemeniz tamamlandıysa{' '}
                  <Link href="/hesabim/siparisler" className="text-rose-600 font-medium hover:underline">
                    siparişlerinizden
                  </Link>{' '}
                  takip edebilirsiniz. Vazgeçtiyseniz sepetinizi geri yükleyebilirsiniz.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={snapshotGeriYukle}
                    className="px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-full hover:bg-rose-600 transition-colors"
                  >
                    Sepeti Geri Yükle ({odemeSnapshot.sepet?.length ?? 0} ürün)
                  </button>
                  <button
                    onClick={snapshotReddet}
                    className="px-4 py-2 border border-stone-200 text-stone-500 text-sm font-medium rounded-full hover:bg-stone-50 transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-7xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-stone-800 mb-3">Sepetiniz boş</h2>
        <p className="text-stone-400 mb-8 text-center max-w-sm">
          Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayabilirsiniz.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/makyaj"
            className="px-6 py-3 border-2 border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-colors"
          >
            Makyaj
          </Link>
          <Link
            href="/yuz-bakimi"
            className="px-6 py-3 border-2 border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-colors"
          >
            Yüz Bakımı
          </Link>
          <Link
            href="/cilt-bakimi"
            className="px-6 py-3 border-2 border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-colors"
          >
            Cilt Bakımı
          </Link>
        </div>
      </div>
    )
  }

  const genelToplam = Math.round((toplamFiyat - uyeIndirimi - indirimTutari + kargoUcreti) * 100) / 100

  return (
    <div className="bg-rose-50/30 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">
          Sepetim <span className="text-lg font-normal text-stone-400">({toplamAdet} ürün)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {sepet.map((item) => {
              const kalanStok = getKalanStok(item.id)
              const maxUlasildi = kalanStok !== null && kalanStok <= 0
              return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4 flex gap-4"
              >
                <Link href={`/urunler/${item.id}`} className="shrink-0">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-rose-50">
                    <Image
                      src={item.gorsel}
                      alt={item.ad}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-rose-400 font-medium uppercase tracking-wider mb-0.5">
                    {item.kategori === 'cilt-bakimi' ? 'Cilt Bakımı' : item.kategori === 'makyaj' ? 'Makyaj' : 'Yüz Bakımı'}
                  </p>
                  <Link href={`/urunler/${item.id}`}>
                    <h3 className="text-sm font-semibold text-stone-800 hover:text-rose-600 transition-colors line-clamp-2 mb-2">
                      {item.ad}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 border border-rose-200 rounded-full">
                      <button
                        onClick={() => adediGuncelle(item.id, item.adet - 1)}
                        className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-lg font-medium"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-stone-800">
                        {item.adet}
                      </span>
                      <button
                        onClick={() => adediGuncelle(item.id, item.adet + 1)}
                        disabled={maxUlasildi}
                        title={maxUlasildi ? 'Stoktaki son ürüne ulaşıldı' : undefined}
                        className="w-11 h-11 flex items-center justify-center text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-lg font-medium disabled:text-stone-300 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-300"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-base font-bold text-stone-900">
                        {(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺
                      </span>
                      <button
                        onClick={() => sepettenCikar(item.id)}
                        className="w-11 h-11 flex items-center justify-center text-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        aria-label="Ürünü sepetten kaldır"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-bold text-stone-900 mb-5">Sipariş Özeti</h2>

              {/* Giriş yapmamış kullanıcıya üye fiyatı CTA'sı */}
              {!girisYapti && (
                <Link href="/hesabim/giris"
                  className="flex items-center gap-2 p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors group">
                  <span className="text-lg">🏷️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-700">Üye Fiyatı ile {Math.round(toplamFiyat * UYE_INDIRIMI_ORANI).toLocaleString('tr-TR')} ₺ Tasarruf Et!</p>
                    <p className="text-xs text-rose-500">Giriş yap veya üye ol →</p>
                  </div>
                </Link>
              )}

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Ara Toplam ({toplamAdet} ürün)</span>
                  <span>{toplamFiyat.toLocaleString('tr-TR')} ₺</span>
                </div>
                {girisYapti && uyeIndirimi > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="text-base">🏷️</span> Üye İndirimi (%5)
                    </span>
                    <span className="text-emerald-700 font-bold">−{uyeIndirimi.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
                {indirimTutari > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      🎟️ Kupon ({indirimKodu})
                    </span>
                    <span className="text-emerald-700 font-bold">−{indirimTutari.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Kargo</span>
                  {toplamFiyat >= 1500 ? (
                    <span className="text-emerald-600 font-medium">Ücretsiz</span>
                  ) : (
                    <span>{kargoUcreti.toLocaleString('tr-TR')} ₺</span>
                  )}
                </div>
                {toplamFiyat < 1500 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-amber-700 font-medium">Ücretsiz kargoya ne kadar kaldı?</span>
                      <span className="text-xs font-bold text-amber-700">
                        {(1500 - toplamFiyat).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((toplamFiyat / 1500) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-amber-600 mt-1.5">
                      {(1500 - toplamFiyat).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺ daha ekleyin, kargo bedava!
                    </p>
                  </div>
                )}
              </div>

              {/* İndirim Kodu */}
              <div className="mb-4">
                {indirimKodu ? (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-emerald-800">{indirimKodu} uygulandı</p>
                        <p className="text-xs text-emerald-600">−{indirimTutari.toLocaleString('tr-TR')} ₺ indirim</p>
                      </div>
                    </div>
                    <button onClick={indirimKaldir} className="text-xs text-stone-400 hover:text-red-500 transition-colors">Kaldır</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="İndirim kodu"
                      value={indirimGirisi}
                      onChange={(e) => { setIndirimGirisi(e.target.value.toUpperCase()); setIndirimHata('') }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), indirimUygula())}
                      className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-100 transition-all uppercase placeholder:normal-case"
                    />
                    <button
                      onClick={indirimUygula}
                      disabled={indirimYukleniyor || !indirimGirisi.trim()}
                      className="px-4 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed shrink-0"
                    >
                      {indirimYukleniyor ? '...' : 'Uygula'}
                    </button>
                  </div>
                )}
                {indirimHata && <p className="mt-1.5 text-xs text-red-500">{indirimHata}</p>}
              </div>

              <div className="border-t border-rose-100 pt-4 mb-5">
                <div className="flex justify-between font-bold text-stone-900">
                  <span>Toplam</span>
                  <span className="text-lg text-rose-600">{genelToplam.toLocaleString('tr-TR')} ₺</span>
                </div>
                <p className="text-xs text-stone-400 mt-1 text-right">KDV dahildir</p>
              </div>

              <Link
                href="/odeme"
                className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-center rounded-full transition-all hover:shadow-lg hover:shadow-rose-200 active:scale-95"
              >
                Ödemeye Geç →
              </Link>

              <Link
                href="/"
                className="block w-full py-3 text-rose-500 hover:text-rose-600 font-medium text-center text-sm mt-3 transition-colors"
              >
                Alışverişe Devam Et
              </Link>

              <SepetEmailKayit />

              <div className="mt-5 pt-5 border-t border-stone-100 grid grid-cols-2 gap-3">
                {[
                  {
                    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
                    text: 'Güvenli Ödeme',
                    alt: 'SSL şifreli',
                  },
                  {
                    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />,
                    text: '30 Gün İade',
                    alt: 'Koşulsuz iade',
                  },
                  {
                    svg: <><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></>,
                    text: 'Hızlı Teslimat',
                    alt: '1-3 iş günü',
                  },
                  {
                    svg: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
                    text: 'Orijinal Ürün',
                    alt: '%100 orjinal',
                  },
                ].map((m) => (
                  <div key={m.text} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        {m.svg}
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-600 leading-none">{m.text}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-none">{m.alt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
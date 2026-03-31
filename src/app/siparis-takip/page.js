'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOCK_SIPARISLER = {
  'GM20260320': {
    no: 'GM20260320',
    tarih: '20 Mart 2026',
    durum: 3,
    kargo: 'Yurtiçi Kargo',
    kargoNo: 'YK887654321',
    tahminiTeslim: '22 Mart 2026',
    urunler: [
      { ad: 'Rose Élégance EDP', adet: 1, fiyat: 799 },
      { ad: 'Rose Gold Far Paleti', adet: 1, fiyat: 459 },
    ],
  },
  'GM20260315': {
    no: 'GM20260315',
    tarih: '15 Mart 2026',
    durum: 4,
    kargo: 'MNG Kargo',
    kargoNo: 'MNG123456789',
    tahminiTeslim: '17 Mart 2026',
    urunler: [
      { ad: 'Kadife Mat Ruj', adet: 2, fiyat: 219 },
    ],
  },
}

const ADIMLAR = [
  { id: 1, label: 'Sipariş Alındı', ikon: '📋', aciklama: 'Siparişiniz onaylandı' },
  { id: 2, label: 'Hazırlanıyor', ikon: '📦', aciklama: 'Ürünleriniz paketleniyor' },
  { id: 3, label: 'Kargoya Verildi', ikon: '🚚', aciklama: 'Kargoya teslim edildi' },
  { id: 4, label: 'Teslim Edildi', ikon: '🏠', aciklama: 'Adresinize ulaştı' },
]

export default function SiparisTakipSayfasi() {
  const [aramaNo, setAramaNo] = useState('')
  const [sonuc, setSonuc] = useState(null)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  function handleAra(e) {
    e.preventDefault()
    if (!aramaNo.trim()) { setHata('Sipariş numarası giriniz'); return }
    setYukleniyor(true)
    setHata('')
    setTimeout(() => {
      setYukleniyor(false)
      const no = aramaNo.trim().toUpperCase()
      if (MOCK_SIPARISLER[no]) {
        setSonuc(MOCK_SIPARISLER[no])
      } else if (no.startsWith('GM')) {
        setSonuc({
          no,
          tarih: '26 Mart 2026',
          durum: 2,
          kargo: 'Yurtiçi Kargo',
          kargoNo: 'YK' + Math.floor(Math.random() * 900000000 + 100000000),
          tahminiTeslim: '28 Mart 2026',
          urunler: [{ ad: 'GAMZELİMED Ürünleri', adet: 1, fiyat: 0 }],
        })
      } else {
        setHata('Sipariş bulunamadı. Lütfen numarayı kontrol edin.')
        setSonuc(null)
      }
    }, 1000)
  }

  return (
    <div className="bg-rose-50/30 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-stone-900 mb-3">Sipariş Takip</h1>
          <p className="text-stone-500">Sipariş numaranızı girerek kargonuzun durumunu takip edin.</p>
        </div>

        {/* Arama formu */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 mb-8">
          <form onSubmit={handleAra} className="flex gap-3">
            <input
              type="text"
              placeholder="Sipariş numaranız (örn: GM20260320)"
              value={aramaNo}
              onChange={(e) => { setAramaNo(e.target.value); setHata('') }}
              className={`flex-1 px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hata ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}
            />
            <button type="submit" disabled={yukleniyor}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors disabled:bg-stone-300 whitespace-nowrap"
            >
              {yukleniyor ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Aranıyor
                </span>
              ) : 'Sorgula'}
            </button>
          </form>
          {hata && <p className="mt-2 text-sm text-red-500">{hata}</p>}
          <p className="mt-3 text-xs text-stone-400">
            Test için: <button onClick={() => setAramaNo('GM20260320')} className="text-rose-500 hover:underline">GM20260320</button> veya{' '}
            <button onClick={() => setAramaNo('GM20260315')} className="text-rose-500 hover:underline">GM20260315</button>
          </p>
        </div>

        {/* Sonuç */}
        {sonuc && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            {/* Başlık */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-rose-200 text-xs font-medium uppercase tracking-wider mb-1">Sipariş Numarası</p>
                  <p className="text-2xl font-bold tracking-widest">{sonuc.no}</p>
                  <p className="text-rose-200 text-sm mt-1">Sipariş Tarihi: {sonuc.tarih}</p>
                </div>
                <div className="text-right">
                  <p className="text-rose-200 text-xs font-medium uppercase tracking-wider mb-1">Tahmini Teslimat</p>
                  <p className="text-lg font-bold">{sonuc.tahminiTeslim}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-6">Sipariş Durumu</h3>
              <div className="relative">
                {/* Bağlantı çizgisi */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-stone-100" />
                <div
                  className="absolute left-5 top-5 w-0.5 bg-rose-400 transition-all"
                  style={{ height: `${Math.min(((sonuc.durum - 1) / 3) * 100, 100)}%` }}
                />

                <div className="space-y-6">
                  {ADIMLAR.map((adim) => {
                    const tamamlandi = adim.id <= sonuc.durum
                    const aktif = adim.id === sonuc.durum
                    return (
                      <div key={adim.id} className="relative flex items-start gap-4">
                        <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 transition-all ${
                          tamamlandi
                            ? 'bg-rose-500 border-rose-500 text-white'
                            : 'bg-white border-stone-200 text-stone-300'
                        } ${aktif ? 'ring-4 ring-rose-100' : ''}`}>
                          <span className="text-base">{tamamlandi ? (adim.id < sonuc.durum ? '✓' : adim.ikon) : adim.ikon}</span>
                        </div>
                        <div className="pt-1.5">
                          <p className={`text-sm font-semibold ${tamamlandi ? 'text-stone-900' : 'text-stone-400'}`}>
                            {adim.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${tamamlandi ? 'text-stone-500' : 'text-stone-300'}`}>
                            {aktif ? adim.aciklama : tamamlandi ? 'Tamamlandı' : 'Bekleniyor'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Kargo bilgisi */}
            <div className="border-t border-rose-100 px-6 py-4 bg-rose-50/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Kargo Firması</p>
                  <p className="text-sm font-semibold text-stone-800">{sonuc.kargo}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Kargo Takip No</p>
                  <p className="text-sm font-mono font-bold text-rose-600">{sonuc.kargoNo}</p>
                </div>
              </div>
            </div>

            {/* Ürün özeti */}
            <div className="border-t border-rose-100 p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">Sipariş Detayı</h3>
              <div className="space-y-2">
                {sonuc.urunler.map((u, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-stone-600">{u.ad} <span className="text-stone-400">×{u.adet}</span></span>
                    {u.fiyat > 0 && <span className="font-medium text-stone-800">{(u.fiyat * u.adet).toLocaleString('tr-TR')} ₺</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-stone-400 mb-2">Sorun mu yaşıyorsunuz?</p>
          <Link href="/iletisim" className="text-rose-500 text-sm font-medium hover:underline">Müşteri hizmetlerimizle iletişime geçin →</Link>
        </div>
      </div>
    </div>
  )
}

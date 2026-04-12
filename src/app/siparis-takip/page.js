'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useSession } from 'next-auth/react'

const ADIMLAR = [
  { id: 1, label: 'Sipariş Alındı', ikon: '📋', aciklama: 'Siparişiniz onaylandı' },
  { id: 2, label: 'Hazırlanıyor', ikon: '📦', aciklama: 'Ürünleriniz paketleniyor' },
  { id: 3, label: 'Kargoya Verildi', ikon: '🚚', aciklama: 'Kargoya teslim edildi' },
  { id: 4, label: 'Teslim Edildi', ikon: '🏠', aciklama: 'Adresinize ulaştı' },
]

// Kargo firması → takip URL'i
const KARGO_TAKIP_URL = {
  'Yurtiçi Kargo': (no) => `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${no}`,
  'MNG Kargo': (no) => `https://www.mngkargo.com.tr/wps/portal/mngkargo/gonderitakip?takipno=${no}`,
  'Aras Kargo': (no) => `https://www.araskargo.com.tr/ArasKargoCustomer/ArasKargoCustomer.aspx?TakipNo=${no}`,
  'PTT Kargo': (no) => `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${no}`,
  'Sürat Kargo': (no) => `https://www.suratkargo.com.tr/KargoSorgulama/${no}`,
  'Sendeo': (no) => `https://www.sendeo.com.tr/gonderi-sorgula?takipNo=${no}`,
}

export default function SiparisTakipSayfasi() {
  const { kullanici } = useAuth()
  const { data: session } = useSession()
  const girisYapti = !!(kullanici || session?.user)

  const [aramaNo, setAramaNo] = useState('')
  const [aramaEmail, setAramaEmail] = useState('')
  const [sonuc, setSonuc] = useState(null)
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  async function handleAra(e) {
    e.preventDefault()
    const no = aramaNo.trim().toUpperCase()
    if (!no) { setHata('Sipariş numarası giriniz'); return }
    if (!girisYapti && !aramaEmail.trim()) { setHata('E-posta adresinizi giriniz'); return }
    setYukleniyor(true)
    setHata('')
    setSonuc(null)
    try {
      // GET yerine POST — email query param'da açık metinde taşınmasın
      const res = await fetch('/api/siparis-takip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siparisNo: no,
          // Giriş yapılmışsa email backend'deki session'dan alınır;
          // giriş yapılmamışsa misafir doğrulaması için burada gönderilir
          email: girisYapti ? undefined : aramaEmail.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setHata(data.hata || 'Sipariş bulunamadı.')
      } else {
        setSonuc(data)
      }
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  const kargoTakipUrl = sonuc?.kargo && sonuc?.kargoNo
    ? (KARGO_TAKIP_URL[sonuc.kargo]?.(sonuc.kargoNo) || null)
    : null

  return (
    <div className="bg-rose-50/30 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-stone-900 mb-3">Sipariş Takip</h1>
          <p className="text-stone-500">Sipariş numaranızı girerek kargonuzun durumunu takip edin.</p>
        </div>

        {/* Arama formu */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 mb-8">
          <form onSubmit={handleAra} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Sipariş numaranız (örn: SP20260411-1234)"
              value={aramaNo}
              onChange={(e) => { setAramaNo(e.target.value); setHata('') }}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hata ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}
            />

            {/* Giriş yapılmamış kullanıcılar için e-posta doğrulama alanı */}
            {girisYapti ? (
              <p className="text-xs text-stone-400 px-1">
                Hesabınıza giriş yaptınız — e-posta doğrulaması otomatik yapılır.
              </p>
            ) : (
              <input
                type="email"
                placeholder="Sipariş e-posta adresiniz"
                value={aramaEmail}
                onChange={(e) => { setAramaEmail(e.target.value); setHata('') }}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hata ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}
              />
            )}

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
            Sipariş numaranız onay e-postanızda yer almaktadır.
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
                  <p className="text-rose-200 text-xs font-medium uppercase tracking-wider mb-1">Durum</p>
                  <p className="text-lg font-bold">{sonuc.durumMetin}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-6">Sipariş Durumu</h3>
              <div className="relative">
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
            {(sonuc.kargo || sonuc.kargoNo) && (
              <div className="border-t border-rose-100 px-6 py-4 bg-rose-50/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Kargo Firması</p>
                    <p className="text-sm font-semibold text-stone-800">{sonuc.kargo || '—'}</p>
                  </div>
                  {sonuc.kargoNo && (
                    <div>
                      <p className="text-xs text-stone-500 mb-1">Kargo Takip No</p>
                      <p className="text-sm font-mono font-bold text-rose-600">{sonuc.kargoNo}</p>
                    </div>
                  )}
                </div>
                {kargoTakipUrl && (
                  <a
                    href={kargoTakipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    🚚 {sonuc.kargo} Sitesinde Takip Et
                  </a>
                )}
                {sonuc.kargoNo && !kargoTakipUrl && (
                  <p className="mt-2 text-xs text-stone-400">Kargo takip numaranızı kargo firmasının web sitesine girerek takip edebilirsiniz.</p>
                )}
              </div>
            )}

            {/* Kargo atanmamışsa bilgi */}
            {sonuc.durum < 3 && !sonuc.kargoNo && (
              <div className="border-t border-rose-100 px-6 py-4 bg-amber-50/50">
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">Kargo bilgisi henüz eklenmedi.</span>{' '}
                  Siparişiniz kargoya verildiğinde takip numarası burada görünecektir.
                </p>
              </div>
            )}

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
              {sonuc.genelToplam > 0 && (
                <div className="flex justify-between text-sm font-bold text-stone-800 mt-3 pt-3 border-t border-stone-100">
                  <span>Genel Toplam</span>
                  <span>{sonuc.genelToplam.toLocaleString('tr-TR')} ₺</span>
                </div>
              )}
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

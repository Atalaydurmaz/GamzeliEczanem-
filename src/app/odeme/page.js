'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'

function InputField({ label, id, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function OdemeSayfasi() {
  const router = useRouter()
  const { sepet, toplamFiyat, kargoUcreti, sepetiBosalt } = useCart()

  const [form, setForm] = useState({
    adSoyad: '',
    email: '',
    telefon: '',
    adres: '',
    sehir: '',
    ilce: '',
    postaKodu: '',
  })
  const [hatalar, setHatalar] = useState({})
  const [yukleniyor, setYukleniyor] = useState(false)
  const [kart, setKart] = useState({ numara: '', isim: '', son: '', cvv: '' })
  const [indirimKodu, setIndirimKodu] = useState('')
  const [indirimGirisi, setIndirimGirisi] = useState('')
  const [indirimTutari, setIndirimTutari] = useState(0)
  const [indirimHata, setIndirimHata] = useState('')
  const [indirimYukleniyor, setIndirimYukleniyor] = useState(false)

  const genelToplam = toplamFiyat - indirimTutari + kargoUcreti

  function guncelle(alan, deger) {
    setForm((o) => ({ ...o, [alan]: deger }))
    if (hatalar[alan]) setHatalar((o) => ({ ...o, [alan]: '' }))
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

  function indirimKaldır() {
    setIndirimKodu('')
    setIndirimTutari(0)
    setIndirimGirisi('')
    setIndirimHata('')
  }

  function dogrula() {
    const h = {}
    if (!form.adSoyad.trim() || form.adSoyad.trim().split(' ').length < 2)
      h.adSoyad = 'Ad ve soyadınızı girin'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      h.email = 'Geçerli bir e-posta adresi girin'
    if (!/^0[5][0-9]{9}$/.test(form.telefon.replace(/\s/g, '')))
      h.telefon = 'Geçerli bir telefon numarası girin (05XX XXX XX XX)'
    if (!form.adres.trim() || form.adres.trim().length < 10)
      h.adres = 'Tam adresinizi girin'
    if (!form.sehir.trim())
      h.sehir = 'Şehir gerekli'
    if (!form.ilce.trim())
      h.ilce = 'İlçe gerekli'
    if (!/^\d{5}$/.test(form.postaKodu))
      h.postaKodu = '5 haneli posta kodu girin'
    const numaraTemiz = kart.numara.replace(/\s/g, '')
    if (!/^\d{16}$/.test(numaraTemiz))
      h.kartNumara = 'Geçerli bir kart numarası girin'
    if (!kart.isim.trim() || kart.isim.trim().split(' ').length < 2)
      h.kartIsim = 'Kart üzerindeki adı soyadı girin'
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(kart.son))
      h.kartSon = 'GG/YY formatında girin (örn: 08/27)'
    if (!/^\d{3,4}$/.test(kart.cvv))
      h.kartCvv = 'CVV 3 veya 4 haneli olmalı'
    return h
  }

  function kartGuncelle(alan, ham) {
    let deger = ham
    if (alan === 'numara') {
      deger = ham.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
    } else if (alan === 'son') {
      deger = ham.replace(/\D/g, '').slice(0, 4)
      if (deger.length > 2) deger = deger.slice(0, 2) + '/' + deger.slice(2)
    } else if (alan === 'cvv') {
      deger = ham.replace(/\D/g, '').slice(0, 4)
    }
    setKart((o) => ({ ...o, [alan]: deger }))
    if (hatalar['kart' + alan.charAt(0).toUpperCase() + alan.slice(1)])
      setHatalar((o) => ({ ...o, ['kart' + alan.charAt(0).toUpperCase() + alan.slice(1)]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const h = dogrula()
    if (Object.keys(h).length > 0) {
      setHatalar(h)
      document.querySelector('[data-hata]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setYukleniyor(true)

    const siparisNo = 'GM' + Date.now().toString().slice(-8)

    // Siparişi kaydet, e-posta ve SMS gönder
    await fetch('/api/siparis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        adSoyad: form.adSoyad,
        telefon: form.telefon,
        siparisNo,
        sepet,
        toplamFiyat,
        indirimKodu: indirimKodu || null,
        indirimTutari,
        kargoUcreti,
        genelToplam,
        adres: form.adres,
        sehir: form.sehir,
        ilce: form.ilce,
        postaKodu: form.postaKodu,
      }),
    }).catch((e) => console.error('Sipariş kaydı hatası:', e))

    sepetiBosalt()
    router.push(`/odeme/basarili?siparis=${siparisNo}`)
  }

  if (sepet.length === 0 && !yukleniyor) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-stone-800 mb-3">Sepetiniz boş</h2>
        <Link href="/makyaj" className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-colors">
          Alışverişe Başla
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-rose-50/30 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Adım göstergesi */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <Link href="/sepet" className="text-stone-400 hover:text-rose-500 transition-colors">Sepet</Link>
          <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-rose-600 font-semibold">Ödeme</span>
          <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-stone-400">Onay</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sol: Form */}
            <div className="lg:col-span-2 space-y-6">

              {/* Kişisel Bilgiler */}
              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 bg-rose-500 text-white text-xs font-bold rounded-full">1</span>
                  Kişisel Bilgiler
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-hata={hatalar.adSoyad ? 'true' : undefined} className="sm:col-span-2">
                    <InputField
                      label="Ad Soyad *"
                      id="adSoyad"
                      type="text"
                      placeholder="Örn: Ayşe Yılmaz"
                      value={form.adSoyad}
                      onChange={(e) => guncelle('adSoyad', e.target.value)}
                      error={hatalar.adSoyad}
                    />
                  </div>
                  <div data-hata={hatalar.email ? 'true' : undefined}>
                    <InputField
                      label="E-posta *"
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={form.email}
                      onChange={(e) => guncelle('email', e.target.value)}
                      error={hatalar.email}
                    />
                  </div>
                  <div data-hata={hatalar.telefon ? 'true' : undefined}>
                    <InputField
                      label="Telefon *"
                      id="telefon"
                      type="tel"
                      placeholder="0532 123 45 67"
                      value={form.telefon}
                      onChange={(e) => guncelle('telefon', e.target.value)}
                      error={hatalar.telefon}
                    />
                  </div>
                </div>
              </div>

              {/* Teslimat Adresi */}
              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 bg-rose-500 text-white text-xs font-bold rounded-full">2</span>
                  Teslimat Adresi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-hata={hatalar.adres ? 'true' : undefined} className="sm:col-span-2">
                    <label htmlFor="adres" className="block text-sm font-medium text-stone-700 mb-1">Açık Adres *</label>
                    <textarea
                      id="adres"
                      rows={3}
                      placeholder="Mahalle, cadde, sokak, bina no, daire no..."
                      value={form.adres}
                      onChange={(e) => guncelle('adres', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                        hatalar.adres
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
                      }`}
                    />
                    {hatalar.adres && <p className="mt-1 text-xs text-red-500">{hatalar.adres}</p>}
                  </div>
                  <div data-hata={hatalar.sehir ? 'true' : undefined}>
                    <InputField
                      label="Şehir *"
                      id="sehir"
                      type="text"
                      placeholder="İstanbul"
                      value={form.sehir}
                      onChange={(e) => guncelle('sehir', e.target.value)}
                      error={hatalar.sehir}
                    />
                  </div>
                  <div data-hata={hatalar.ilce ? 'true' : undefined}>
                    <InputField
                      label="İlçe *"
                      id="ilce"
                      type="text"
                      placeholder="Kadıköy"
                      value={form.ilce}
                      onChange={(e) => guncelle('ilce', e.target.value)}
                      error={hatalar.ilce}
                    />
                  </div>
                  <div data-hata={hatalar.postaKodu ? 'true' : undefined}>
                    <InputField
                      label="Posta Kodu *"
                      id="postaKodu"
                      type="text"
                      placeholder="34710"
                      maxLength={5}
                      value={form.postaKodu}
                      onChange={(e) => guncelle('postaKodu', e.target.value.replace(/\D/g, ''))}
                      error={hatalar.postaKodu}
                    />
                  </div>
                </div>
              </div>

              {/* İndirim Kodu */}
              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 bg-rose-500 text-white text-xs font-bold rounded-full">3</span>
                  İndirim Kodu
                </h2>

                {indirimKodu ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">{indirimKodu} uygulandı</p>
                        <p className="text-xs text-emerald-600">-{indirimTutari.toLocaleString('tr-TR')} ₺ indirim</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={indirimKaldır}
                      className="text-xs text-stone-400 hover:text-red-500 transition-colors font-medium"
                    >
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="İndirim kodunuzu girin"
                      value={indirimGirisi}
                      onChange={(e) => { setIndirimGirisi(e.target.value.toUpperCase()); setIndirimHata('') }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), indirimUygula())}
                      className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-100 transition-all uppercase placeholder:normal-case"
                    />
                    <button
                      type="button"
                      onClick={indirimUygula}
                      disabled={indirimYukleniyor || !indirimGirisi.trim()}
                      className="px-5 py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed shrink-0"
                    >
                      {indirimYukleniyor ? '...' : 'Uygula'}
                    </button>
                  </div>
                )}

                {indirimHata && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {indirimHata}
                  </p>
                )}
              </div>

              {/* Ödeme Yöntemi */}
              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 bg-rose-500 text-white text-xs font-bold rounded-full">4</span>
                  Ödeme Yöntemi
                </h2>

                {/* Kredi / Banka Kartı — aktif */}
                <div className="relative flex items-start gap-4 p-4 rounded-xl border-2 border-rose-400 bg-rose-50 mb-5">
                  <div className="flex items-center justify-center w-10 h-10 bg-rose-100 rounded-full shrink-0">
                    <span className="text-xl">💳</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800 text-sm">Kredi / Banka Kartı</p>
                    <p className="text-xs text-stone-500 mt-0.5">VISA · Mastercard · TROY</p>
                  </div>
                  <div className="absolute top-3 right-3 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Kart bilgileri formu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div data-hata={hatalar.kartNumara ? 'true' : undefined} className="sm:col-span-2">
                    <InputField
                      label="Kart Numarası *"
                      id="kartNumara"
                      type="text"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={kart.numara}
                      onChange={(e) => kartGuncelle('numara', e.target.value)}
                      error={hatalar.kartNumara}
                    />
                  </div>
                  <div data-hata={hatalar.kartIsim ? 'true' : undefined} className="sm:col-span-2">
                    <InputField
                      label="Kart Üzerindeki İsim *"
                      id="kartIsim"
                      type="text"
                      placeholder="AYŞE YILMAZ"
                      value={kart.isim}
                      onChange={(e) => kartGuncelle('isim', e.target.value.toUpperCase())}
                      error={hatalar.kartIsim}
                    />
                  </div>
                  <div data-hata={hatalar.kartSon ? 'true' : undefined}>
                    <InputField
                      label="Son Kullanma Tarihi *"
                      id="kartSon"
                      type="text"
                      inputMode="numeric"
                      placeholder="AA/YY"
                      maxLength={5}
                      value={kart.son}
                      onChange={(e) => kartGuncelle('son', e.target.value)}
                      error={hatalar.kartSon}
                    />
                  </div>
                  <div data-hata={hatalar.kartCvv ? 'true' : undefined}>
                    <InputField
                      label="CVV *"
                      id="kartCvv"
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      maxLength={4}
                      value={kart.cvv}
                      onChange={(e) => kartGuncelle('cvv', e.target.value)}
                      error={hatalar.kartCvv}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Sağ: Sipariş Özeti */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6 sticky top-20">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Sipariş Özeti</h2>

                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {sepet.map((item) => (
                    <div key={item.id} className="flex justify-between items-center gap-2 text-sm">
                      <span className="text-stone-600 line-clamp-1 flex-1">{item.ad}</span>
                      <span className="shrink-0 text-stone-500">×{item.adet}</span>
                      <span className="shrink-0 font-medium text-stone-800">
                        {(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-rose-100 pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Ara Toplam</span>
                    <span>{toplamFiyat.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  {indirimTutari > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                      <span>İndirim ({indirimKodu})</span>
                      <span>-{indirimTutari.toLocaleString('tr-TR')} ₺</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Kargo</span>
                    {kargoUcreti === 0 ? (
                      <span className="text-emerald-600 font-medium">Ücretsiz</span>
                    ) : (
                      <span>{kargoUcreti.toLocaleString('tr-TR')} ₺</span>
                    )}
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-rose-100">
                    <span>Toplam</span>
                    <span className="text-rose-600 text-lg">{genelToplam.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={yukleniyor}
                  className={`w-full py-4 rounded-full font-bold text-white transition-all ${
                    yukleniyor
                      ? 'bg-stone-300 cursor-not-allowed'
                      : 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 active:scale-95'
                  }`}
                >
                  {yukleniyor ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      İşleniyor...
                    </span>
                  ) : (
                    `Siparişi Tamamla – ${genelToplam.toLocaleString('tr-TR')} ₺`
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4M13.5 21H5a2 2 0 01-2-2V7a2 2 0 012-2h9" />
                  </svg>
                  Onay e-postası gönderilecek
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

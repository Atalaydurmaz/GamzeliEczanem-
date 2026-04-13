'use client'

import { useState } from 'react'

const konular = [
  'Sipariş ve Kargo',
  'İade ve Değişim',
  'Ürün Bilgisi',
  'Teknik Sorun',
  'İş Birliği',
  'Diğer',
]

export default function IletisimSayfasi() {
  const [form, setForm] = useState({ ad: '', email: '', telefon: '', konu: '', mesaj: '', faxNumber: '' })
  const [hatalar, setHatalar] = useState({})
  const [durum, setDurum] = useState('bos') // bos | yukleniyor | basarili | hata
  const [sunucuHata, setSunucuHata] = useState('')

  function guncelle(alan, deger) {
    setForm((o) => ({ ...o, [alan]: deger }))
    if (hatalar[alan]) setHatalar((o) => ({ ...o, [alan]: '' }))
  }

  function dogrula() {
    const h = {}
    if (!form.ad.trim() || form.ad.trim().length < 2) h.ad = 'Adınızı girin (en az 2 karakter)'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) h.email = 'Geçerli bir e-posta girin'
    if (!form.konu) h.konu = 'Konu seçin'
    if (!form.mesaj.trim()) h.mesaj = 'Mesajınızı yazın'
    return h
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSunucuHata('')

    const h = dogrula()
    if (Object.keys(h).length > 0) {
      setHatalar(h)
      return
    }

    // Honeypot — botu susturarak reddet
    if (form.faxNumber) {
      setDurum('basarili')
      return
    }

    setDurum('yukleniyor')

    try {
      const res = await fetch('/api/iletisim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: form.ad.trim(),
          email: form.email.trim(),
          telefon: form.telefon.trim(),
          konu: form.konu,
          mesaj: form.mesaj.trim(),
          faxNumber: form.faxNumber,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSunucuHata(data.error || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.')
        setDurum('hata')
        return
      }

      setDurum('basarili')
      setForm({ ad: '', email: '', telefon: '', konu: '', mesaj: '', faxNumber: '' })
    } catch (err) {
      console.error('İletişim formu hatası:', err)
      setSunucuHata('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.')
      setDurum('hata')
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-stone-900 mb-3">İletişim</h1>
          <p className="text-stone-500">Size yardımcı olmaktan mutluluk duyarız.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Sol: İletişim bilgileri */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900 mb-6">Bize Ulaşın</h2>
              <div className="space-y-4">
                {[
                  {
                    ikon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    ),
                    baslik: 'Telefon',
                    deger: '0262 412 6928',
                    href: 'tel:02624126928',
                  },
                  {
                    ikon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    ),
                    baslik: 'E-posta',
                    deger: 'destek.gamzelieczanem@gmail.com',
                    href: null,
                  },
                  {
                    ikon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    ),
                    baslik: 'Adres',
                    deger: 'Yeni Çiftlik, Kazım Karabekir Cd. No:12\n41650 Gölcük / Kocaeli',
                    href: null,
                  },
                ].map((item) => (
                  <div key={item.baslik} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-500 shrink-0">
                      {item.ikon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-0.5">{item.baslik}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-stone-800 hover:text-rose-600 transition-colors font-medium">
                          {item.deger}
                        </a>
                      ) : (
                        <p className="text-sm text-stone-800 font-medium whitespace-pre-line">{item.deger}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Çalışma saatleri */}
            <div className="bg-rose-50 rounded-2xl border border-rose-100 p-5">
              <h3 className="text-sm font-bold text-stone-800 mb-3">Çalışma Saatlerimiz</h3>
              <div className="space-y-1.5 text-sm">
                {[
                  { gun: 'Pazartesi – Cuma', saat: '09:00 – 18:00' },
                  { gun: 'Cumartesi', saat: '10:00 – 16:00' },
                  { gun: 'Pazar', saat: 'Kapalı' },
                ].map((s) => (
                  <div key={s.gun} className="flex justify-between">
                    <span className="text-stone-500">{s.gun}</span>
                    <span className={`font-medium ${s.saat === 'Kapalı' ? 'text-stone-400' : 'text-stone-800'}`}>{s.saat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Maps */}
            <div className="relative h-52 rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent('Yeni Çiftlik, Kazım Karabekir Cd. No:12, 41650 Gölcük/Kocaeli')}&output=embed&z=16`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="GAMZELİECZANEM Konumu"
              />
            </div>
          </div>

          {/* Sağ: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8">
              <h2 className="text-xl font-bold text-stone-900 mb-6">Mesaj Gönderin</h2>

              {durum === 'basarili' ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">Mesajınız İletildi!</h3>
                  <p className="text-stone-500 mb-6">En kısa sürede size dönüş yapacağız (genellikle 24 saat içinde).</p>
                  <button onClick={() => { setDurum('bos'); setSunucuHata('') }}
                    className="px-6 py-2.5 border border-rose-200 text-rose-600 rounded-full text-sm font-medium hover:bg-rose-50 transition-colors">
                    Yeni Mesaj Gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Honeypot — botlar bu alanı doldurur, insanlar görmez */}
                  <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
                    <label htmlFor="faxNumber">Website</label>
                    <input
                      id="faxNumber"
                      type="text"
                      name="faxNumber"
                      value={form.faxNumber}
                      onChange={(e) => setForm((o) => ({ ...o, faxNumber: e.target.value }))}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Sunucu hatası */}
                  {sunucuHata && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                      {sunucuHata}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Ad Soyad *</label>
                      <input type="text" placeholder="Adınız Soyadınız" value={form.ad} onChange={(e) => guncelle('ad', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hatalar.ad ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`} />
                      {hatalar.ad && <p className="mt-1 text-xs text-red-500">{hatalar.ad}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">E-posta *</label>
                      <input type="email" placeholder="ornek@email.com" value={form.email} onChange={(e) => guncelle('email', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${hatalar.email ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`} />
                      {hatalar.email && <p className="mt-1 text-xs text-red-500">{hatalar.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Telefon</label>
                      <input type="tel" placeholder="0532 123 45 67" value={form.telefon} onChange={(e) => guncelle('telefon', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Konu *</label>
                      <select value={form.konu} onChange={(e) => guncelle('konu', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white ${hatalar.konu ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`}>
                        <option value="">Konu seçin</option>
                        {konular.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                      {hatalar.konu && <p className="mt-1 text-xs text-red-500">{hatalar.konu}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Mesajınız *</label>
                    <textarea rows={5} placeholder="Mesajınızı buraya yazın..." value={form.mesaj} onChange={(e) => guncelle('mesaj', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${hatalar.mesaj ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'}`} />
                    <div className="flex justify-between mt-1">
                      {hatalar.mesaj ? <p className="text-xs text-red-500">{hatalar.mesaj}</p> : <span />}
                    </div>
                  </div>

                  {/* KVKK Aydınlatma Metni */}
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Gönderdiğiniz mesaj, yalnızca talebinizi yanıtlamak amacıyla <strong className="text-stone-500">GAMZELİECZANEM</strong> tarafından işlenecektir.{' '}
                    <a href="/gizlilik-politikasi" className="text-rose-500 hover:underline">Gizlilik Politikamızı</a> inceleyebilirsiniz.
                  </p>

                  <button type="submit" disabled={durum === 'yukleniyor'}
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-all disabled:bg-stone-300 disabled:cursor-not-allowed">
                    {durum === 'yukleniyor' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Gönderiliyor...
                      </span>
                    ) : 'Mesajı Gönder'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

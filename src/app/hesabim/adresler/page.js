'use client'

import { useState, useEffect } from 'react'

export default function AdreslerimSayfasi() {
  const [adresler, setAdresler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [formAcik, setFormAcik] = useState(false)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [siliniyor, setSiliniyor] = useState(null) // silinecek adres id'si
  const [sunucuHata, setSunucuHata] = useState('')
  const [form, setForm] = useState({ baslik: '', ad: '', telefon: '', il: '', ilce: '', mahalle: '', adres: '', postaKodu: '' })
  const [hatalar, setHatalar] = useState({})

  useEffect(() => {
    fetch('/api/hesabim/adresler')
      .then((r) => r.json())
      .then((d) => { setAdresler(Array.isArray(d) ? d : []); setYukleniyor(false) })
      .catch(() => setYukleniyor(false))
  }, [])

  function dogrula() {
    const h = {}
    if (!form.baslik.trim()) h.baslik = 'Adres başlığı girin'
    if (!form.ad.trim()) h.ad = 'Ad soyad girin'
    if (!form.telefon.trim()) h.telefon = 'Telefon girin'
    if (!form.il.trim()) h.il = 'İl girin'
    if (!form.ilce.trim()) h.ilce = 'İlçe girin'
    if (!form.adres.trim()) h.adres = 'Açık adres girin'
    return h
  }

  async function kaydet(e) {
    e.preventDefault()
    const h = dogrula()
    if (Object.keys(h).length > 0) { setHatalar(h); return }

    setKaydediliyor(true)
    setSunucuHata('')
    try {
      const res = await fetch('/api/hesabim/adresler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setSunucuHata(data.error || 'Kaydedilemedi, tekrar deneyin.'); return }
      setAdresler((prev) => [data, ...prev])
      setForm({ baslik: '', ad: '', telefon: '', il: '', ilce: '', mahalle: '', adres: '', postaKodu: '' })
      setHatalar({})
      setFormAcik(false)
    } catch {
      setSunucuHata('Bağlantı hatası.')
    } finally {
      setKaydediliyor(false)
    }
  }

  async function sil(id) {
    setSiliniyor(id)
    try {
      await fetch(`/api/hesabim/adresler/${id}`, { method: 'DELETE' })
      setAdresler((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // Sessiz hata — kullanıcı tekrar deneyebilir
    } finally {
      setSiliniyor(null)
    }
  }

  function guncelle(alan, deger) {
    setForm((f) => ({ ...f, [alan]: deger }))
    if (hatalar[alan]) setHatalar((h) => ({ ...h, [alan]: '' }))
  }

  function formIptal() {
    setFormAcik(false)
    setForm({ baslik: '', ad: '', telefon: '', il: '', ilce: '', mahalle: '', adres: '', postaKodu: '' })
    setHatalar({})
    setSunucuHata('')
  }

  const inputCls = (alan) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
      hatalar[alan] ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
    }`

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-stone-900">Adreslerim</h2>
          {!formAcik && (
            <button
              onClick={() => setFormAcik(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-full hover:bg-rose-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Adres
            </button>
          )}
        </div>

        {yukleniyor ? (
          <div className="flex justify-center py-10">
            <svg className="animate-spin w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : adresler.length === 0 && !formAcik ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📍</p>
            <p className="text-sm font-medium text-stone-500 mb-1">Kayıtlı adresiniz yok</p>
            <p className="text-xs text-stone-400">Yeni adres ekleyerek hızlı alışveriş yapın.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {adresler.map((adres) => (
              <div key={adres.id} className="border border-stone-200 rounded-xl p-4 relative group">
                <span className="inline-block text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5 mb-2">
                  {adres.baslik}
                </span>
                <p className="text-sm font-semibold text-stone-800">{adres.ad}</p>
                <p className="text-xs text-stone-500 mt-0.5">{adres.telefon}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  {adres.adres}{adres.mahalle ? `, ${adres.mahalle}` : ''}, {adres.ilce} / {adres.il}{adres.postaKodu ? ` ${adres.postaKodu}` : ''}
                </p>
                <button
                  onClick={() => sil(adres.id)}
                  disabled={siliniyor === adres.id}
                  className="absolute top-3 right-3 p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Adresi sil"
                >
                  {siliniyor === adres.id ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yeni adres formu */}
      {formAcik && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-stone-900 mb-5">Yeni Adres Ekle</h3>

          {sunucuHata && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {sunucuHata}
            </div>
          )}

          <form onSubmit={kaydet} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Adres Başlığı *</label>
              <input type="text" placeholder="Ev, İş..." value={form.baslik}
                onChange={(e) => guncelle('baslik', e.target.value)} className={inputCls('baslik')} maxLength={50} />
              {hatalar.baslik && <p className="mt-1 text-xs text-red-500">{hatalar.baslik}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Ad Soyad *</label>
                <input type="text" value={form.ad} onChange={(e) => guncelle('ad', e.target.value)}
                  className={inputCls('ad')} maxLength={100} />
                {hatalar.ad && <p className="mt-1 text-xs text-red-500">{hatalar.ad}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Telefon *</label>
                <input type="tel" placeholder="05xx xxx xx xx" value={form.telefon}
                  onChange={(e) => guncelle('telefon', e.target.value)} className={inputCls('telefon')} maxLength={20} />
                {hatalar.telefon && <p className="mt-1 text-xs text-red-500">{hatalar.telefon}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">İl *</label>
                <input type="text" value={form.il} onChange={(e) => guncelle('il', e.target.value)}
                  className={inputCls('il')} maxLength={100} />
                {hatalar.il && <p className="mt-1 text-xs text-red-500">{hatalar.il}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">İlçe *</label>
                <input type="text" value={form.ilce} onChange={(e) => guncelle('ilce', e.target.value)}
                  className={inputCls('ilce')} maxLength={100} />
                {hatalar.ilce && <p className="mt-1 text-xs text-red-500">{hatalar.ilce}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Mahalle</label>
                <input type="text" value={form.mahalle} onChange={(e) => guncelle('mahalle', e.target.value)}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                  maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Posta Kodu</label>
                <input type="text" value={form.postaKodu}
                  onChange={(e) => guncelle('postaKodu', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                  maxLength={5} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Açık Adres *</label>
              <textarea rows={2} placeholder="Cadde, sokak, bina no, daire no..." value={form.adres}
                onChange={(e) => guncelle('adres', e.target.value)}
                className={`${inputCls('adres')} resize-none`} maxLength={500} />
              {hatalar.adres && <p className="mt-1 text-xs text-red-500">{hatalar.adres}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={kaydediliyor}
                className="px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-full hover:bg-rose-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center gap-2">
                {kaydediliyor && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Kaydet
              </button>
              <button type="button" onClick={formIptal}
                className="px-6 py-2.5 border border-stone-200 text-stone-600 text-sm font-medium rounded-full hover:bg-stone-50 transition-colors">
                İptal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

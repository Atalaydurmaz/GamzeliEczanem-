'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const DURUM_STIL = {
  'Hazırlanıyor':    'bg-amber-100 text-amber-700',
  'Kargoya Verildi': 'bg-blue-100 text-blue-700',
  'Teslim Edildi':   'bg-emerald-100 text-emerald-700',
  'İptal Talebi':    'bg-orange-100 text-orange-700',
  'İptal Edildi':    'bg-red-100 text-red-600',
}

export default function SiparislerimSayfasi() {
  const { kullanici, yukleniyor: authYukleniyor } = useCurrentUser()
  const [siparisler, setSiparisler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const [yuklenmeHatasi, setYuklenmeHatasi] = useState(false)
  const [acikId, setAcikId] = useState(null)
  const [iptalYukleniyor, setIptalYukleniyor] = useState(null)
  const [iptalOnay, setIptalOnay] = useState(null)
  const [iadeForm, setIadeForm] = useState(null) // { siparis } veya null
  const [iadeSecili, setIadeSecili] = useState([])
  const [iadeNeden, setIadeNeden] = useState('')
  const [iadeAciklama, setIadeAciklama] = useState('')
  const [iadeYukleniyor, setIadeYukleniyor] = useState(false)
  const [iadeBasarili, setIadeBasarili] = useState(false)

  useEffect(() => {
    if (!kullanici?.email) return
    setYukleniyor(true)
    setYuklenmeHatasi(false)
    fetch('/api/hesabim/siparisler')
      .then((r) => { if (!r.ok) throw new Error('Sunucu hatası'); return r.json() })
      .then(setSiparisler)
      .catch(() => setYuklenmeHatasi(true))
      .finally(() => setYukleniyor(false))
  }, [kullanici?.email])

  function iadeAc(siparis) {
    setIadeForm({ siparis })
    setIadeSecili(siparis.urunler.map((u) => u.id))
    setIadeNeden('')
    setIadeAciklama('')
    setIadeBasarili(false)
  }

  async function iadeGonder() {
    if (!iadeSecili.length || !iadeNeden) return
    setIadeYukleniyor(true)
    try {
      // musteriEmail artık body'de gönderilmez — sunucu session'dan alır
      const res = await fetch('/api/iade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siparisNo: iadeForm.siparis.siparisNo,
          urunler: iadeForm.siparis.urunler.filter((u) => iadeSecili.includes(u.id)),
          neden: iadeNeden,
          aciklama: iadeAciklama,
        }),
      })
      if (res.ok) setIadeBasarili(true)
      else setHatalar ? null : alert('İade talebi gönderilemedi. Lütfen tekrar deneyin.')
    } catch {
      alert('Bağlantı hatası. İnternet bağlantınızı kontrol edin.')
    } finally {
      setIadeYukleniyor(false)
    }
  }

  async function iptalTalepEt() {
    if (!iptalOnay) return
    setIptalYukleniyor(iptalOnay)
    setIptalOnay(null)
    try {
      // email artık body'de gönderilmez — sunucu session'dan alır
      const res = await fetch(`/api/siparis/${iptalOnay}/iptal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        setSiparisler((prev) =>
          prev.map((s) => s.siparisNo === iptalOnay ? { ...s, durum: 'İptal Talebi' } : s)
        )
      }
    } catch {}
    setIptalYukleniyor(null)
  }

  if (authYukleniyor) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
        <div className="py-14 flex justify-center">
          <div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" />
        </div>
      </div>
    )
  }

  if (!kullanici) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-stone-900 mb-6">Siparişlerim</h2>
        <div className="text-center py-14">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-base font-semibold text-stone-700 mb-2">Giriş yapmanız gerekiyor</p>
          <Link href="/hesabim/giris"
            className="inline-block px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-full hover:bg-rose-700 transition-colors">
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
    {iadeForm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setIadeForm(null)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {iadeBasarili ? (
            <div className="text-center py-6">
              <div className="flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-2">İade Talebiniz Alındı!</h3>
              <p className="text-sm text-stone-500 mb-6">En kısa sürede size dönüş yapacağız.</p>
              <button onClick={() => setIadeForm(null)} className="px-6 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors">
                Tamam
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-base font-bold text-stone-900 mb-1">İade Talebi</h3>
              <p className="text-xs text-stone-400 mb-5 font-mono">{iadeForm.siparis.siparisNo}</p>

              {/* Ürün seçimi */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">İade Edilecek Ürünler</p>
                <div className="space-y-2">
                  {iadeForm.siparis.urunler.map((u) => (
                    <label key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:bg-rose-50/40 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={iadeSecili.includes(u.id)}
                        onChange={(e) => setIadeSecili(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id))}
                        className="w-4 h-4 accent-rose-500"
                      />
                      <span className="text-sm text-stone-700 flex-1">{u.ad}</span>
                      <span className="text-xs text-stone-400">×{u.adet}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Neden */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">İade Nedeni *</p>
                <div className="space-y-1.5">
                  {['Ürün hasarlı/defolu geldi', 'Yanlış ürün geldi', 'Ürün beklentilerimi karşılamadı', 'Fikir değişikliği', 'Diğer'].map((n) => (
                    <label key={n} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="neden" value={n} checked={iadeNeden === n} onChange={() => setIadeNeden(n)} className="w-4 h-4 accent-rose-500" />
                      <span className="text-sm text-stone-700">{n}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Açıklama */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Açıklama (isteğe bağlı)</p>
                <textarea
                  rows={3}
                  value={iadeAciklama}
                  onChange={(e) => setIadeAciklama(e.target.value)}
                  placeholder="Detaylı bilgi yazabilirsiniz..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setIadeForm(null)} className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors">
                  Vazgeç
                </button>
                <button
                  onClick={iadeGonder}
                  disabled={iadeYukleniyor || !iadeSecili.length || !iadeNeden}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {iadeYukleniyor ? 'Gönderiliyor...' : 'Talep Gönder'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    {iptalOnay && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setIptalOnay(null)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full mx-auto mb-4">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-stone-900 text-center mb-1">Siparişi İptal Et</h3>
          <p className="text-sm text-stone-500 text-center mb-2">
            <span className="font-mono font-semibold text-stone-700">{iptalOnay}</span> nolu siparişin iptal talebini göndermek istediğinizden emin misiniz?
          </p>
          <p className="text-xs text-stone-400 text-center mb-6">İptal talebiniz admin onayına gönderilecektir.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setIptalOnay(null)}
              className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={iptalTalepEt}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              İptal Talep Et
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-stone-900 mb-6">Siparişlerim</h2>

      {yukleniyor ? (
        <div className="py-14 flex justify-center">
          <div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" />
        </div>
      ) : yuklenmeHatasi ? (
        <div className="text-center py-14">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-base font-semibold text-stone-700 mb-2">Siparişler yüklenemedi</p>
          <p className="text-sm text-stone-400 mb-6">İnternet bağlantınızı kontrol edip tekrar deneyin.</p>
          <button
            onClick={() => { setYuklenmeHatasi(false); setYukleniyor(true); fetch('/api/hesabim/siparisler').then(r => r.ok ? r.json() : Promise.reject()).then(setSiparisler).catch(() => setYuklenmeHatasi(true)).finally(() => setYukleniyor(false)) }}
            className="px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-full hover:bg-rose-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      ) : siparisler.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-5xl mb-4">📦</p>
          <h3 className="text-base font-semibold text-stone-700 mb-2">Henüz siparişiniz yok</h3>
          <p className="text-sm text-stone-400 mb-6">Verdiğiniz siparişler burada listelenecektir.</p>
          <Link href="/"
            className="inline-block px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-full hover:bg-rose-700 transition-colors">
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {siparisler.map((siparis) => (
            <div key={siparis.siparisNo} className="border border-stone-100 rounded-xl overflow-hidden">
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-rose-50/40 transition-colors"
                onClick={() => setAcikId(acikId === siparis.siparisNo ? null : siparis.siparisNo)}
              >
                <div>
                  <p className="text-sm font-semibold text-stone-800 font-mono">{siparis.siparisNo}</p>
                  <p className="text-xs text-stone-400">
                    {new Date(siparis.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DURUM_STIL[siparis.durum] ?? 'bg-stone-100 text-stone-600'}`}>
                    {siparis.durum}
                  </span>
                  <span className="text-sm font-bold text-stone-900">
                    {siparis.genelToplam.toLocaleString('tr-TR')} ₺
                  </span>
                  {siparis.durum === 'Hazırlanıyor' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setIptalOnay(siparis.siparisNo) }}
                      disabled={iptalYukleniyor === siparis.siparisNo}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {iptalYukleniyor === siparis.siparisNo ? 'İşleniyor...' : 'İptal Talep Et'}
                    </button>
                  )}
                  {siparis.durum === 'Kargoya Verildi' && siparis.kargoTakipNo && (
                    <a
                      href="https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-colors"
                    >
                      Kargom Nerede?
                    </a>
                  )}
                  {siparis.durum === 'Teslim Edildi' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); iadeAc(siparis) }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      İade Talep Et
                    </button>
                  )}
                </div>
              </div>

              {acikId === siparis.siparisNo && (
                <div className="border-t border-stone-100 px-4 py-4 bg-stone-50 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Ürünler</p>
                    <ul className="space-y-1">
                      {siparis.urunler.map((u, i) => (
                        <li key={i} className="flex justify-between gap-2">
                          <span className="text-stone-600 truncate flex-1">{u.ad}</span>
                          <span className="text-stone-400 shrink-0">×{u.adet}</span>
                          <span className="text-stone-700 font-medium shrink-0">
                            {(u.fiyat * u.adet).toLocaleString('tr-TR')} ₺
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between text-xs text-stone-500">
                    <span>Kargo: {siparis.kargoUcreti === 0 ? 'Ücretsiz' : `${siparis.kargoUcreti} ₺`}</span>
                    <span className="font-bold text-stone-800">Toplam: {siparis.genelToplam.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  {siparis.kargoTakipNo && (
                    <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-xs text-sky-700 flex items-center justify-between gap-2">
                      <span>Takip No: <span className="font-mono font-bold">{siparis.kargoTakipNo}</span></span>
                      <a
                        href="https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline hover:no-underline"
                      >
                        Takip Et →
                      </a>
                    </div>
                  )}
                  {siparis.durum === 'İptal Talebi' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
                      İptal talebiniz admin onayı bekliyor.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}

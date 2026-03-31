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
  const [acikId, setAcikId] = useState(null)
  const [iptalYukleniyor, setIptalYukleniyor] = useState(null)

  useEffect(() => {
    if (!kullanici?.email) return
    setYukleniyor(true)
    fetch(`/api/hesabim/siparisler?email=${encodeURIComponent(kullanici.email)}`)
      .then((r) => r.json())
      .then(setSiparisler)
      .catch(() => {})
      .finally(() => setYukleniyor(false))
  }, [kullanici?.email])

  async function iptalTalepEt(siparisNo) {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) return
    setIptalYukleniyor(siparisNo)
    try {
      const res = await fetch(`/api/siparis/${siparisNo}/iptal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: kullanici.email }),
      })
      if (res.ok) {
        setSiparisler((prev) =>
          prev.map((s) => s.siparisNo === siparisNo ? { ...s, durum: 'İptal Talebi' } : s)
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
    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-stone-900 mb-6">Siparişlerim</h2>

      {yukleniyor ? (
        <div className="py-14 flex justify-center">
          <div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" />
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
                      onClick={(e) => { e.stopPropagation(); iptalTalepEt(siparis.siparisNo) }}
                      disabled={iptalYukleniyor === siparis.siparisNo}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {iptalYukleniyor === siparis.siparisNo ? 'İşleniyor...' : 'İptal Talep Et'}
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
  )
}

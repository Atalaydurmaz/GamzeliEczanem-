'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStock } from '@/context/StockContext'

const DURUMLAR = ['Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi', 'İptal Edildi']

const DURUM_STIL = {
  'Hazırlanıyor':    'bg-amber-100 text-amber-700 border border-amber-200',
  'Kargoya Verildi': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Teslim Edildi':   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'İptal Talebi':    'bg-orange-100 text-orange-700 border border-orange-200',
  'İptal Edildi':    'bg-red-100 text-red-600 border border-red-200',
}

function StatKart({ baslik, deger, alt, ikon }) {
  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{ikon}</span>
      </div>
      <p className="text-2xl font-bold text-stone-900 mb-0.5">{deger}</p>
      <p className="text-sm font-medium text-stone-700">{baslik}</p>
      {alt && <p className="text-xs text-stone-400 mt-0.5">{alt}</p>}
    </div>
  )
}


function SiparisDetay({ siparis, onKargoKaydet }) {
  const [takipNo, setTakipNo] = useState(siparis.kargoTakipNo || '')
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)

  async function handleKaydet() {
    if (!takipNo.trim()) return
    setKaydediliyor(true)
    await onKargoKaydet(siparis.siparisNo, takipNo)
    setKaydediliyor(false)
    setGonderildi(true)
    setTimeout(() => setGonderildi(false), 3000)
  }

  return (
    <div className="bg-stone-50 border-t border-stone-100 px-4 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
      {/* Müşteri */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Müşteri</p>
        <p className="text-stone-700 font-medium">{siparis.musteri.adSoyad}</p>
        <p className="text-stone-500">{siparis.musteri.email}</p>
        <p className="text-stone-500">{siparis.musteri.telefon}</p>
      </div>
      {/* Teslimat */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Teslimat Adresi</p>
        <p className="text-stone-600 leading-relaxed">
          {siparis.teslimat.adres}<br />
          {siparis.teslimat.ilce} / {siparis.teslimat.sehir} {siparis.teslimat.postaKodu}
        </p>
        {/* Kargo takip no */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Yurtiçi Kargo Takip No</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={takipNo}
              onChange={(e) => setTakipNo(e.target.value)}
              placeholder="Takip numarası"
              className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-rose-400"
            />
            <button
              onClick={handleKaydet}
              disabled={kaydediliyor || !takipNo.trim()}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                gonderildi ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40'
              }`}
            >
              {kaydediliyor ? '...' : gonderildi ? '✓ Gönderildi' : 'Kaydet & Bildir'}
            </button>
          </div>
        </div>
      </div>
      {/* Ürünler */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Ürünler</p>
        <ul className="space-y-1">
          {siparis.urunler.map((u, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="text-stone-600 truncate flex-1">{u.ad}</span>
              <span className="text-stone-400 shrink-0">×{u.adet}</span>
              <span className="text-stone-700 font-medium shrink-0">{(u.fiyat * u.adet).toLocaleString('tr-TR')} ₺</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StokYonetimi({ adminUrunler = [] }) {
  const [stoklar, setStoklar] = useState({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [guncelleniyor, setGuncelleniyor] = useState(null)
  const [stokArama, setStokArama] = useState('')
  const { refreshStok } = useStock()

  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(setStoklar).finally(() => setYukleniyor(false))
  }, [])

  async function stokGuncelle(urunId, yeniStok) {
    setGuncelleniyor(urunId)
    await fetch('/api/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urunId, stok: yeniStok }),
    })
    setStoklar((prev) => ({ ...prev, [String(urunId)]: Math.max(0, yeniStok) }))
    refreshStok()
    setGuncelleniyor(null)
  }

  const filtreliUrunler = useMemo(() => {
    const q = stokArama.toLowerCase()
    return adminUrunler.filter((u) => !q || u.ad.toLowerCase().includes(q))
  }, [stokArama, adminUrunler])

  if (yukleniyor) return <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" /></div>

  const dusukStokSayisi = adminUrunler.filter((u) => {
    const s = stoklar[String(u.id)] ?? 0
    return s > 0 && s < 5
  }).length
  const stokTukendiSayisi = adminUrunler.filter((u) => (stoklar[String(u.id)] ?? 0) === 0).length

  return (
    <div className="space-y-4">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{adminUrunler.length - stokTukendiSayisi - dusukStokSayisi}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Yeterli Stok</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{dusukStokSayisi}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">Düşük Stok (&lt;5)</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stokTukendiSayisi}</p>
          <p className="text-xs text-red-500 font-medium mt-0.5">Stok Tükendi</p>
        </div>
      </div>

      {/* Arama */}
      <input
        type="text"
        placeholder="Ürün ara..."
        value={stokArama}
        onChange={(e) => setStokArama(e.target.value)}
        className="w-full sm:w-72 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
      />

      {/* Tablo */}
      <div className="overflow-x-auto rounded-xl border border-stone-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Ürün</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider w-32">Stok</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider w-40">Güncelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtreliUrunler.map((urun) => {
              const stok = stoklar[String(urun.id)] ?? 0
              const dusuk = stok > 0 && stok < 5
              const tukendi = stok === 0
              return (
                <tr key={urun.id} className={tukendi ? 'bg-red-50/50' : dusuk ? 'bg-amber-50/50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800 line-clamp-1">{urun.ad}</p>
                    <p className="text-xs text-stone-400">#{urun.id}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${tukendi ? 'bg-red-100 text-red-600' : dusuk ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {tukendi ? 'Tükendi' : `${stok} adet`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => stokGuncelle(urun.id, stok - 1)}
                        disabled={stok === 0 || guncelleniyor === urun.id}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-stone-600"
                      >−</button>
                      <span className="w-10 text-center font-semibold text-stone-800">{stok}</span>
                      <button
                        onClick={() => stokGuncelle(urun.id, stok + 1)}
                        disabled={guncelleniyor === urun.id}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-stone-600"
                      >+</button>
                      <input
                        type="number"
                        min="0"
                        defaultValue={stok}
                        key={stok}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val !== stok) stokGuncelle(urun.id, val)
                        }}
                        className="w-16 px-2 py-1 border border-stone-200 rounded-lg text-center text-sm focus:outline-none focus:border-rose-400 transition-all"
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const KATEGORI_ADLARI = {
  'cilt-bakimi': 'Cilt Bakımı',
  makyaj: 'Makyaj',
  parfum: 'Parfüm',
  'sac-bakimi': 'Saç Bakımı',
  'gunes-bakimi': 'Güneş Koruyucu',
  'anne-bebek': 'Anne & Bebek',
}

function BarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.gelir), 1)
  const cols = data.length
  const barW = Math.max(4, Math.floor(600 / cols) - 2)
  const totalW = cols * (barW + 2)
  const H = 140

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${H + 24}`} className="w-full" style={{ minWidth: Math.min(totalW, 300) }}>
        {data.map((d, i) => {
          const barH = d.gelir > 0 ? Math.max(4, (d.gelir / maxVal) * H) : 0
          const x = i * (barW + 2)
          const showLabel = cols <= 14 || i % Math.ceil(cols / 14) === 0
          return (
            <g key={i}>
              <rect x={x} y={H - barH} width={barW} height={barH} fill={barH > 0 ? '#f43f5e' : '#fce7f3'} rx={2} />
              {showLabel && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={8} fill="#a8a29e">
                  {d.tarih.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                </text>
              )}
              {d.gelir > 0 && (
                <title>{d.tarih.toLocaleDateString('tr-TR')}: {d.gelir.toLocaleString('tr-TR')} ₺</title>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function RaporlarSekme({ siparisler, adminUrunler = [] }) {
  const [aralik, setAralik] = useState('30')

  const filtreliSiparisler = useMemo(() => {
    const gun = aralik === 'bugun' ? 0 : parseInt(aralik)
    const baslangic = new Date()
    baslangic.setDate(baslangic.getDate() - gun)
    baslangic.setHours(0, 0, 0, 0)
    return siparisler.filter((s) => new Date(s.tarih) >= baslangic)
  }, [siparisler, aralik])

  const gunlukGelir = useMemo(() => {
    const gun = aralik === 'bugun' ? 1 : parseInt(aralik)
    return Array.from({ length: gun }, (_, i) => {
      const tarih = new Date()
      tarih.setDate(tarih.getDate() - (gun - 1 - i))
      tarih.setHours(0, 0, 0, 0)
      const tarihStr = tarih.toDateString()
      const gelir = filtreliSiparisler
        .filter((s) => new Date(s.tarih).toDateString() === tarihStr)
        .reduce((sum, s) => sum + s.genelToplam, 0)
      return { tarih, gelir }
    })
  }, [filtreliSiparisler, aralik])

  const enCokSatilan = useMemo(() => {
    const map = {}
    filtreliSiparisler.forEach((s) =>
      s.urunler.forEach((u) => {
        if (!map[u.id]) map[u.id] = { ad: u.ad, adet: 0, gelir: 0 }
        map[u.id].adet += u.adet
        map[u.id].gelir += u.fiyat * u.adet
      })
    )
    return Object.values(map).sort((a, b) => b.adet - a.adet).slice(0, 5)
  }, [filtreliSiparisler])

  const kategoriGelir = useMemo(() => {
    const map = {}
    filtreliSiparisler.forEach((s) =>
      s.urunler.forEach((u) => {
        const urunData = adminUrunler.find((ur) => ur.id === u.id)
        const katAd = KATEGORI_ADLARI[urunData?.kategori] ?? urunData?.kategori ?? 'Diğer'
        map[katAd] = (map[katAd] ?? 0) + u.fiyat * u.adet
      })
    )
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtreliSiparisler])

  const durumSayilari = useMemo(() => {
    const map = {}
    filtreliSiparisler.forEach((s) => { map[s.durum] = (map[s.durum] ?? 0) + 1 })
    return map
  }, [filtreliSiparisler])

  const toplamGelir = filtreliSiparisler.reduce((s, o) => s + o.genelToplam, 0)
  const ortalamaSiparis = filtreliSiparisler.length > 0 ? toplamGelir / filtreliSiparisler.length : 0
  const maxKategoriGelir = Math.max(...kategoriGelir.map(([, v]) => v), 1)

  function exportCSV() {
    const rows = [
      ['Sipariş No', 'Tarih', 'Müşteri', 'Telefon', 'E-posta', 'Şehir', 'Ürünler', 'Ara Toplam', 'Kargo', 'Genel Toplam', 'Durum'],
      ...siparisler.map((s) => [
        s.siparisNo,
        new Date(s.tarih).toLocaleDateString('tr-TR'),
        s.musteri.adSoyad,
        s.musteri.telefon,
        s.musteri.email,
        `${s.teslimat?.ilce ?? ''} / ${s.teslimat?.sehir ?? ''}`,
        s.urunler.map((u) => `${u.ad} x${u.adet}`).join(' | '),
        s.toplamFiyat ?? '',
        s.kargoUcreti ?? 0,
        s.genelToplam,
        s.durum,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `siparisler-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ARALIK_SECENEKLER = [
    { value: 'bugun', label: 'Bugün' },
    { value: '7', label: 'Son 7 Gün' },
    { value: '30', label: 'Son 30 Gün' },
  ]

  return (
    <div className="space-y-6">
      {/* Üst bar: filtre + export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {ARALIK_SECENEKLER.map((s) => (
            <button key={s.value} onClick={() => setAralik(s.value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${aralik === s.value ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-full transition-all shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel İndir (.csv)
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">📦</p>
          <p className="text-2xl font-bold text-stone-900">{filtreliSiparisler.length}</p>
          <p className="text-sm text-stone-500 mt-0.5">Sipariş</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">💰</p>
          <p className="text-2xl font-bold text-stone-900">{toplamGelir.toLocaleString('tr-TR')} ₺</p>
          <p className="text-sm text-stone-500 mt-0.5">Toplam Gelir</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">🧾</p>
          <p className="text-2xl font-bold text-stone-900">{ortalamaSiparis.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</p>
          <p className="text-sm text-stone-500 mt-0.5">Ortalama Sipariş</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl mb-1">✅</p>
          <p className="text-2xl font-bold text-stone-900">{durumSayilari['Teslim Edildi'] ?? 0}</p>
          <p className="text-sm text-stone-500 mt-0.5">Teslim Edildi</p>
        </div>
      </div>

      {/* Günlük gelir grafiği */}
      <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-stone-800 mb-4">Günlük Gelir (₺)</h3>
        {toplamGelir === 0 ? (
          <div className="h-32 flex items-center justify-center text-stone-400 text-sm">Bu dönemde sipariş yok</div>
        ) : (
          <BarChart data={gunlukGelir} />
        )}
      </div>

      {/* Alt bölüm: 3 kutu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* En çok satan ürünler */}
        <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">En Çok Satan Ürünler</h3>
          {enCokSatilan.length === 0 ? (
            <p className="text-stone-400 text-sm">Veri yok</p>
          ) : (
            <ol className="space-y-3">
              {enCokSatilan.map((u, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-stone-300 text-stone-700' : i === 2 ? 'bg-amber-700/70 text-white' : 'bg-stone-100 text-stone-500'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{u.ad}</p>
                    <p className="text-xs text-stone-400">{u.gelir.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <span className="text-xs font-bold text-rose-600 shrink-0">{u.adet} adet</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Kategoriye göre gelir */}
        <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">Kategoriye Göre Gelir</h3>
          {kategoriGelir.length === 0 ? (
            <p className="text-stone-400 text-sm">Veri yok</p>
          ) : (
            <div className="space-y-3">
              {kategoriGelir.map(([kat, gelir]) => (
                <div key={kat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-stone-700">{kat}</span>
                    <span className="text-stone-500">{gelir.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="h-1.5 bg-rose-50 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${(gelir / maxKategoriGelir) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Durum dağılımı */}
        <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-800 mb-4">Durum Dağılımı</h3>
          <div className="space-y-3">
            {[
              { durum: 'Hazırlanıyor', renk: 'bg-amber-400', ikon: '⏳' },
              { durum: 'Kargoya Verildi', renk: 'bg-blue-400', ikon: '🚚' },
              { durum: 'Teslim Edildi', renk: 'bg-emerald-400', ikon: '✅' },
              { durum: 'İptal Talebi', renk: 'bg-orange-400', ikon: '⚠️' },
              { durum: 'İptal Edildi', renk: 'bg-red-400', ikon: '❌' },
            ].map(({ durum, renk, ikon }) => {
              const sayi = durumSayilari[durum] ?? 0
              const oran = filtreliSiparisler.length > 0 ? (sayi / filtreliSiparisler.length) * 100 : 0
              return (
                <div key={durum}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-stone-700">{ikon} {durum}</span>
                    <span className="text-stone-500">{sayi} sipariş</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full ${renk} rounded-full transition-all`} style={{ width: `${oran}%` }} />
                  </div>
                </div>
              )
            })}
            {filtreliSiparisler.length === 0 && <p className="text-stone-400 text-sm">Veri yok</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

const KATEGORILER = [
  { value: 'cilt-bakimi',   label: 'Cilt Bakımı' },
  { value: 'makyaj',        label: 'Makyaj' },
  { value: 'parfum',        label: 'Parfüm' },
  { value: 'sac-bakimi',    label: 'Saç Bakımı' },
  { value: 'gunes-bakimi',  label: 'Güneş Koruyucu' },
  { value: 'anne-bebek',    label: 'Anne & Bebek' },
]

const BOŞ_FORM = { id: '', ad: '', kategori: 'cilt-bakimi', altKategori: '', fiyat: '', eskiFiyat: '', stok: '10', aciklama: '', detay: '', gorsel: '', etiket: '', aktif: true }

function GorselYukle({ url, onChange }) {
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function dosyaSec(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setHata('')
    setYukleniyor(true)
    const fd = new FormData()
    fd.append('gorsel', file)
    const res = await fetch('/api/admin/products/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) {
      onChange(data.url)
    } else {
      setHata(data.error || 'Yükleme başarısız')
    }
    setYukleniyor(false)
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      {url && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
          <img src={url} alt="Önizleme" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs transition-colors"
          >✕</button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => onChange(e.target.value)}
          placeholder="/uploads/products/urun.jpg veya https://..."
          className="flex-1 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
        />
        <label className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${yukleniyor ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>
          {yukleniyor ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Yükleniyor
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Yükle
            </span>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={dosyaSec} disabled={yukleniyor} />
        </label>
      </div>
      {hata && <p className="text-xs text-red-500">{hata}</p>}
    </div>
  )
}

function UrunlerSekme() {
  const [urunler, setUrunler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(null) // null | { mod: 'ekle' | 'duzenle', urun?: {} }
  const [form, setForm] = useState(BOŞ_FORM)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [siliniyor, setSiliniyor] = useState(null)
  const [hata, setHata] = useState('')
  const [arama, setArama] = useState('')

  useEffect(() => {
    fetch('/api/admin/products').then(r => r.json()).then(setUrunler).finally(() => setYukleniyor(false))
  }, [])

  function aç(mod, urun) {
    setHata('')
    if (mod === 'ekle') {
      setForm(BOŞ_FORM)
    } else {
      setForm({
        id:          String(urun.id),
        ad:          urun.ad ?? '',
        kategori:    urun.kategori ?? 'cilt-bakimi',
        altKategori: urun.alt_kategori ?? '',
        fiyat:       String(urun.fiyat ?? ''),
        eskiFiyat:   String(urun.eski_fiyat ?? ''),
        stok:        String(urun.stok ?? '0'),
        aciklama:    urun.aciklama ?? '',
        detay:       urun.detay ?? '',
        gorsel:      urun.gorsel ?? '',
        etiket:      urun.etiket ?? '',
        aktif:       urun.aktif !== false,
      })
    }
    setModal({ mod, urun })
  }

  function kapat() { setModal(null); setHata('') }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function kaydet(e) {
    e.preventDefault()
    setHata('')
    setKaydediyor(true)
    const payload = {
      ad: form.ad, kategori: form.kategori, altKategori: form.altKategori || null,
      fiyat: Number(form.fiyat), eskiFiyat: form.eskiFiyat ? Number(form.eskiFiyat) : null,
      stok: Number(form.stok) || 0, aciklama: form.aciklama || null, detay: form.detay || null,
      gorsel: form.gorsel || null, etiket: form.etiket || null, aktif: form.aktif,
    }
    try {
      let res, data
      if (modal.mod === 'ekle') {
        res = await fetch('/api/admin/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: Number(form.id) }),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Hata')
        setUrunler(p => [...p, { ...data, stok: Number(form.stok) || 0 }])
      } else {
        res = await fetch(`/api/admin/products/${modal.urun.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Hata')
        setUrunler(p => p.map(u => u.id === modal.urun.id ? { ...data, stok: Number(form.stok) || 0 } : u))
      }
      kapat()
    } catch (err) {
      setHata(err.message)
    }
    setKaydediyor(false)
  }

  async function sil(id) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return
    setSiliniyor(id)
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) setUrunler(p => p.filter(u => u.id !== id))
    setSiliniyor(null)
  }

  const filtreliUrunler = arama
    ? urunler.filter(u => u.ad?.toLowerCase().includes(arama.toLowerCase()) || String(u.id).includes(arama))
    : urunler

  async function csvIcerAktar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const text = await file.text()
    const satirlar = text.trim().split(/\r?\n/)
    const baslik = satirlar[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''))
    const zorunlu = ['id', 'ad', 'kategori', 'fiyat']
    const eksik = zorunlu.filter(k => !baslik.includes(k))
    if (eksik.length > 0) {
      alert(`CSV'de eksik sütun: ${eksik.join(', ')}\n\nGerekli sütunlar: id, ad, kategori, fiyat\nOpsiyonel: eskiFiyat, stok, aciklama, detay, gorsel, etiket, aktif`)
      return
    }
    const idx = k => baslik.indexOf(k)
    const satirDizisi = satirlar.slice(1).filter(s => s.trim())
    const kayitlar = satirDizisi.map(satir => {
      const cols = satir.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
      return {
        id: Number(cols[idx('id')]),
        ad: cols[idx('ad')] || '',
        kategori: cols[idx('kategori')] || 'cilt-bakimi',
        altKategori: idx('altKategori') >= 0 ? cols[idx('altKategori')] || null : null,
        fiyat: Number(cols[idx('fiyat')]) || 0,
        eskiFiyat: idx('eskiFiyat') >= 0 && cols[idx('eskiFiyat')] ? Number(cols[idx('eskiFiyat')]) : null,
        stok: idx('stok') >= 0 ? Number(cols[idx('stok')]) || 0 : 10,
        aciklama: idx('aciklama') >= 0 ? cols[idx('aciklama')] || null : null,
        detay: idx('detay') >= 0 ? cols[idx('detay')] || null : null,
        gorsel: idx('gorsel') >= 0 ? cols[idx('gorsel')] || null : null,
        etiket: idx('etiket') >= 0 ? cols[idx('etiket')] || null : null,
        aktif: idx('aktif') >= 0 ? cols[idx('aktif')] !== 'false' : true,
      }
    }).filter(r => r.id && r.ad)

    if (kayitlar.length === 0) { alert('CSV dosyasında geçerli satır bulunamadı.'); return }
    if (!confirm(`${kayitlar.length} ürün içe aktarılacak. Devam edilsin mi?`)) return

    let basarili = 0, hatali = 0
    for (const kayit of kayitlar) {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kayit),
      })
      if (res.ok) {
        const data = await res.json()
        setUrunler(p => [...p, { ...data, stok: kayit.stok }])
        basarili++
      } else {
        hatali++
      }
    }
    alert(`İçe aktarma tamamlandı.\n✓ ${basarili} başarılı  ✗ ${hatali} hatalı`)
  }

  function csvSablonIndir() {
    const satir = 'id,ad,kategori,altKategori,fiyat,eskiFiyat,stok,aciklama,detay,gorsel,etiket,aktif'
    const ornek = '101,Örnek Ürün,cilt-bakimi,,299.90,399.90,20,Kısa açıklama,,/uploads/products/urun.jpg,Yeni,true'
    const csv = satir + '\n' + ornek
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'urun-sablonu.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (yukleniyor) return <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" /></div>

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <input
          type="text" placeholder="Ürün ara..."
          value={arama} onChange={e => setArama(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={csvSablonIndir}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Şablon İndir
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            CSV İçe Aktar
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={csvIcerAktar} />
          </label>
          <button
            onClick={() => aç('ekle')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Ürün Adı</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Kategori</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Fiyat</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Stok</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Durum</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider w-28">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtreliUrunler.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-stone-400">Ürün bulunamadı</td></tr>
            )}
            {filtreliUrunler.map(urun => (
              <tr key={urun.id} className={!urun.aktif ? 'opacity-50' : ''}>
                <td className="px-4 py-3 text-xs text-stone-400 font-mono">{urun.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-800 line-clamp-1">{urun.ad}</p>
                  {urun.etiket && <span className="text-xs text-rose-500 font-medium">{urun.etiket}</span>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-stone-500">{KATEGORILER.find(k => k.value === urun.kategori)?.label ?? urun.kategori}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-stone-800">
                  {Number(urun.fiyat).toLocaleString('tr-TR')} ₺
                  {urun.eski_fiyat && <p className="text-xs text-stone-400 line-through">{Number(urun.eski_fiyat).toLocaleString('tr-TR')} ₺</p>}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(urun.stok ?? 0) === 0 ? 'bg-red-100 text-red-600' : (urun.stok ?? 0) < 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {urun.stok ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urun.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {urun.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => aç('duzenle', urun)}
                      className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                    >Düzenle</button>
                    <button
                      onClick={() => sil(urun.id)}
                      disabled={siliniyor === urun.id}
                      className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                    >Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-stone-900">{modal.mod === 'ekle' ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}</h3>
              <button onClick={kapat} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors">✕</button>
            </div>
            <form onSubmit={kaydet} className="p-6 space-y-4">
              {hata && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{hata}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">ID <span className="text-red-400">*</span></label>
                  <input type="number" required value={form.id} onChange={e => set('id', e.target.value)}
                    disabled={modal.mod === 'duzenle'}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all disabled:bg-stone-50 disabled:text-stone-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Stok</label>
                  <input type="number" min="0" value={form.stok} onChange={e => set('stok', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Ürün Adı <span className="text-red-400">*</span></label>
                <input type="text" required value={form.ad} onChange={e => set('ad', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Kategori <span className="text-red-400">*</span></label>
                  <select value={form.kategori} onChange={e => set('kategori', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all bg-white">
                    {KATEGORILER.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Alt Kategori</label>
                  <input type="text" value={form.altKategori} onChange={e => set('altKategori', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Fiyat (₺) <span className="text-red-400">*</span></label>
                  <input type="number" min="0" step="0.01" required value={form.fiyat} onChange={e => set('fiyat', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Eski Fiyat (₺)</label>
                  <input type="number" min="0" step="0.01" value={form.eskiFiyat} onChange={e => set('eskiFiyat', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Görsel</label>
                <GorselYukle url={form.gorsel} onChange={url => set('gorsel', url)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Etiket</label>
                  <input type="text" value={form.etiket} onChange={e => set('etiket', e.target.value)} placeholder="Yeni, Çok Satan..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.aktif} onChange={e => set('aktif', e.target.checked)}
                      className="w-4 h-4 accent-rose-500" />
                    <span className="text-sm font-medium text-stone-700">Aktif</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Kısa Açıklama</label>
                <textarea rows={2} value={form.aciklama} onChange={e => set('aciklama', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Detay (uzun açıklama)</label>
                <textarea rows={3} value={form.detay} onChange={e => set('detay', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={kapat}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-all">
                  İptal
                </button>
                <button type="submit" disabled={kaydediyor}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white text-sm font-semibold rounded-xl transition-all">
                  {kaydediyor ? 'Kaydediliyor...' : modal.mod === 'ekle' ? 'Ekle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MesajlarSekme({ mesajlar, setMesajlar }) {
  const [acikId, setAcikId] = useState(null)
  const [cevap, setCevap] = useState('')
  const [gonderiyor, setGonderiyor] = useState(false)
  const [filtre, setFiltre] = useState('hepsi') // hepsi | okunmamis | cevaplandi

  const filtrelenmis = mesajlar.filter(m => {
    if (filtre === 'okunmamis') return !m.okundu
    if (filtre === 'cevaplandi') return !!m.cevap
    return true
  })

  async function okunduIsaretle(id) {
    await fetch('/api/admin/mesajlar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'okundu' }),
    })
    setMesajlar(prev => prev.map(m => m.id === id ? { ...m, okundu: true } : m))
  }

  async function cevapla(id) {
    if (!cevap.trim()) return
    setGonderiyor(true)
    await fetch('/api/admin/mesajlar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cevapla', cevap }),
    })
    setMesajlar(prev => prev.map(m => m.id === id ? { ...m, cevap, cevap_tarihi: new Date().toISOString(), okundu: true } : m))
    setCevap('')
    setGonderiyor(false)
  }

  async function sil(id) {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return
    await fetch('/api/admin/mesajlar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMesajlar(prev => prev.filter(m => m.id !== id))
    if (acikId === id) setAcikId(null)
  }

  return (
    <div className="space-y-4">
      {/* Filtre */}
      <div className="flex gap-2">
        {[
          { value: 'hepsi', label: `Tümü (${mesajlar.length})` },
          { value: 'okunmamis', label: `Okunmamış (${mesajlar.filter(m => !m.okundu).length})` },
          { value: 'cevaplandi', label: `Cevaplanan (${mesajlar.filter(m => m.cevap).length})` },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltre(f.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${filtre === f.value ? 'bg-rose-500 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
        {filtrelenmis.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Mesaj bulunamadı</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtrelenmis.map(m => (
              <div key={m.id} className={`${!m.okundu ? 'bg-rose-50/40' : ''}`}>
                <div
                  className="px-6 py-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                  onClick={() => { setAcikId(acikId === m.id ? null : m.id); if (!m.okundu) okunduIsaretle(m.id) }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {!m.okundu && <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />}
                        <span className="text-sm font-semibold text-stone-800">{m.ad}</span>
                        <span className="text-xs text-stone-400">{m.email}</span>
                        {m.siparis_no && <span className="text-xs font-mono text-rose-500">{m.siparis_no}</span>}
                        {m.cevap && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Cevaplandı</span>}
                      </div>
                      <p className="text-sm font-medium text-stone-700">{m.konu}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{new Date(m.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); sil(m.id) }} className="text-stone-300 hover:text-red-500 transition-colors p-1 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {acikId === m.id && (
                  <div className="px-6 pb-5 bg-stone-50/50 border-t border-stone-100">
                    <p className="text-sm text-stone-700 mt-4 leading-relaxed whitespace-pre-wrap">{m.mesaj}</p>
                    {m.cevap && (
                      <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-600 mb-1">Cevabınız · {m.cevap_tarihi ? new Date(m.cevap_tarihi).toLocaleDateString('tr-TR') : ''}</p>
                        <p className="text-sm text-stone-700 whitespace-pre-wrap">{m.cevap}</p>
                      </div>
                    )}
                    {!m.cevap && (
                      <div className="mt-4">
                        <textarea
                          value={cevap}
                          onChange={e => setCevap(e.target.value)}
                          placeholder="Cevabınızı yazın... (müşteriye e-posta ile gönderilecek)"
                          rows={3}
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none"
                        />
                        <button
                          onClick={() => cevapla(m.id)}
                          disabled={gonderiyor || !cevap.trim()}
                          className="mt-2 px-4 py-2 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-all"
                        >
                          {gonderiyor ? 'Gönderiliyor...' : 'Cevapla'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BildirimlerSekme({ gecikenSiparisler, okunmamisMesajlar, iadeler, adminUrunler, onSekmeGit }) {
  const bekleyenIade = iadeler.filter(i => i.durum === 'Beklemede')

  // Görselsiz veya açıklamasız ürünler
  const eksikIcerikliUrunler = adminUrunler.filter(u => !u.gorsel || !u.aciklama)

  const bildirimler = [
    ...gecikenSiparisler.map(s => ({
      tip: 'geciken',
      renk: 'bg-red-50 border-red-200',
      ikonRenk: 'bg-red-100 text-red-600',
      ikon: '⏰',
      baslik: `${s.siparisNo} siparişi gecikiyor`,
      aciklama: `${s.musteri.adSoyad} — ${Math.floor((Date.now() - new Date(s.tarih).getTime()) / 3600000)} saattir kargoya verilmedi`,
      buton: 'Siparişe Git',
      sekme: 'siparisler',
    })),
    ...bekleyenIade.map(i => ({
      tip: 'iade',
      renk: 'bg-orange-50 border-orange-200',
      ikonRenk: 'bg-orange-100 text-orange-600',
      ikon: '↩️',
      baslik: `${i.siparis_no} için iade talebi`,
      aciklama: `${i.musteri_ad} — ${i.neden}`,
      buton: 'İadelere Git',
      sekme: 'iadeler',
    })),
    ...okunmamisMesajlar.map(m => ({
      tip: 'mesaj',
      renk: 'bg-rose-50 border-rose-200',
      ikonRenk: 'bg-rose-100 text-rose-600',
      ikon: '✉️',
      baslik: `${m.ad} — ${m.konu}`,
      aciklama: m.mesaj.substring(0, 80) + (m.mesaj.length > 80 ? '...' : ''),
      buton: 'Mesajlara Git',
      sekme: 'mesajlar',
    })),
    ...eksikIcerikliUrunler.map(u => ({
      tip: 'eksik',
      renk: 'bg-amber-50 border-amber-200',
      ikonRenk: 'bg-amber-100 text-amber-600',
      ikon: '⚠️',
      baslik: `"${u.ad}" ürününde eksik içerik`,
      aciklama: [!u.gorsel && 'Görsel yok', !u.aciklama && 'Açıklama yok'].filter(Boolean).join(', '),
      buton: 'Ürünlere Git',
      sekme: 'urunler',
    })),
  ]

  return (
    <div className="space-y-4">
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-2xl border p-4 ${gecikenSiparisler.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${gecikenSiparisler.length > 0 ? 'text-red-600' : 'text-stone-400'}`}>{gecikenSiparisler.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Geciken Sipariş</p>
        </div>
        <div className={`rounded-2xl border p-4 ${okunmamisMesajlar.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${okunmamisMesajlar.length > 0 ? 'text-rose-600' : 'text-stone-400'}`}>{okunmamisMesajlar.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Okunmamış Mesaj</p>
        </div>
        <div className={`rounded-2xl border p-4 ${bekleyenIade.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${bekleyenIade.length > 0 ? 'text-orange-600' : 'text-stone-400'}`}>{bekleyenIade.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Bekleyen İade</p>
        </div>
        <div className={`rounded-2xl border p-4 ${eksikIcerikliUrunler.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100'}`}>
          <p className={`text-2xl font-bold ${eksikIcerikliUrunler.length > 0 ? 'text-amber-600' : 'text-stone-400'}`}>{eksikIcerikliUrunler.length}</p>
          <p className="text-xs text-stone-500 mt-0.5">Eksik İçerik</p>
        </div>
      </div>

      {/* Bildirim listesi */}
      {bildirimler.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm px-6 py-16 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm font-semibold text-stone-600">Her şey yolunda!</p>
          <p className="text-xs text-stone-400 mt-1">Bekleyen aksiyon yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bildirimler.map((b, i) => (
            <div key={i} className={`rounded-2xl border ${b.renk} p-4 flex items-start gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${b.ikonRenk} flex items-center justify-center text-lg shrink-0`}>{b.ikon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800">{b.baslik}</p>
                <p className="text-xs text-stone-500 mt-0.5">{b.aciklama}</p>
              </div>
              <button
                onClick={() => onSekmeGit(b.sekme)}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-white border border-stone-200 text-stone-600 rounded-lg hover:border-rose-300 hover:text-rose-600 transition-all"
              >
                {b.buton}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Eksik içerikli ürünler detay */}
      {eksikIcerikliUrunler.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h3 className="text-sm font-bold text-stone-800">⚠️ Eksik İçerikli Ürünler</h3>
            <p className="text-xs text-stone-400 mt-0.5">Bu ürünlerin görsel veya açıklaması eksik — satışı olumsuz etkiler</p>
          </div>
          <div className="divide-y divide-stone-100">
            {eksikIcerikliUrunler.slice(0, 10).map(u => (
              <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                  {u.gorsel ? <img src={u.gorsel} className="w-full h-full object-cover rounded-lg" alt="" /> : <span className="text-stone-400 text-xs">📷</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{u.ad}</p>
                  <p className="text-xs text-amber-600">
                    {[!u.gorsel && '❌ Görsel', !u.aciklama && '❌ Açıklama'].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  onClick={() => onSekmeGit('urunler')}
                  className="text-xs text-rose-600 hover:underline font-medium shrink-0"
                >Düzenle →</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MusterilerSekme({ musteriler }) {
  const [arama, setArama] = useState('')
  const [siralama, setSiralama] = useState('yeni') // yeni | harcama | siparis

  const filtrelenmis = useMemo(() => {
    const q = arama.toLowerCase()
    let liste = q
      ? musteriler.filter(m => m.ad?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
      : [...musteriler]
    if (siralama === 'harcama') liste.sort((a, b) => b.toplamHarcama - a.toplamHarcama)
    else if (siralama === 'siparis') liste.sort((a, b) => b.siparisSayisi - a.siparisSayisi)
    else liste.sort((a, b) => new Date(b.kayitTarihi) - new Date(a.kayitTarihi))
    return liste
  }, [musteriler, arama, siralama])

  const toplamHarcama = musteriler.reduce((s, m) => s + m.toplamHarcama, 0)
  const aktifMusteriler = musteriler.filter(m => m.siparisSayisi > 0).length

  return (
    <div className="space-y-4">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl font-bold text-stone-900">{musteriler.length}</p>
          <p className="text-sm text-stone-500 mt-0.5">Toplam Üye</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl font-bold text-stone-900">{aktifMusteriler}</p>
          <p className="text-sm text-stone-500 mt-0.5">Sipariş Veren</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-2xl font-bold text-stone-900">{toplamHarcama.toLocaleString('tr-TR')} ₺</p>
          <p className="text-sm text-stone-500 mt-0.5">Toplam Harcama</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={arama}
          onChange={e => setArama(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
        />
        <div className="flex gap-2">
          {[
            { value: 'yeni', label: 'En Yeni' },
            { value: 'harcama', label: 'En Çok Harcayan' },
            { value: 'siparis', label: 'En Çok Sipariş' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setSiralama(s.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${siralama === s.value ? 'bg-rose-500 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-rose-300'}`}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
        {filtrelenmis.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Müşteri bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">E-posta</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider">Sipariş</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Harcama</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Üyelik</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Giriş Tipi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtrelenmis.map(m => (
                  <tr key={m.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">
                          {m.ad?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-medium text-stone-800">{m.ad}</p>
                          <p className="text-xs text-stone-400 sm:hidden">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{m.email}</td>
                    <td className="px-4 py-3 text-center">
                      {m.siparisSayisi > 0 ? (
                        <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">{m.siparisSayisi}</span>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-700 hidden md:table-cell">
                      {m.toplamHarcama > 0 ? `${m.toplamHarcama.toLocaleString('tr-TR')} ₺` : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-stone-400 hidden lg:table-cell">
                      {m.kayitTarihi ? new Date(m.kayitTarihi).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {m.googleHesabi ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Google</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-medium">E-posta</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPaneli() {
  // Middleware gla_admin cookie'sini HMAC ile doğruladığı için bu sayfaya
  // yalnızca geçerli admin token'ı olan kullanıcılar ulaşabilir.
  // 'yukleniyor' → veriler yüklenirken; 'panel' → hazır
  const [ekran, setEkran] = useState('yukleniyor') // yukleniyor | panel
  const [aktifSekme, setAktifSekme] = useState('siparisler') // siparisler | stok | raporlar | urunler | yorumlar | iadeler | musteriler
  const [siparisler, setSiparisler] = useState([])
  const [adminUrunler, setAdminUrunler] = useState([])
  const [yorumlar, setYorumlar] = useState([])
  const [iadeler, setIadeler] = useState([])
  const [musteriler, setMusteriler] = useState([])
  const [mesajlar, setMesajlar] = useState([])
  const [stoklar, setStoklar] = useState({})
  const [veriYukleniyor, setVeriYukleniyor] = useState(false)
  const [acikId, setAcikId] = useState(null)
  const [arama, setArama] = useState('')

  const fetchOrders = useCallback(async () => {
    setVeriYukleniyor(true)
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) setSiparisler(await res.json())
    } catch {}
    setVeriYukleniyor(false)
  }, [])

  useEffect(() => {
    fetch('/api/admin/products').then(r => r.json()).then(d => setAdminUrunler(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/reviews').then(r => r.json()).then(d => setYorumlar(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/iade').then(r => r.json()).then(d => setIadeler(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/users').then(r => r.json()).then(d => setMusteriler(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/admin/mesajlar').then(r => r.json()).then(d => setMesajlar(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/stock').then(r => r.json()).then(d => setStoklar(d || {})).catch(() => {})
  }, [])

  useEffect(() => {
    // Middleware zaten doğruladı; check yine de çağrılır (savunma katmanı).
    // Olası token manipülasyonunda /admin/giris'e yönlendir.
    fetch('/api/admin/check').then((r) => {
      if (r.ok) { setEkran('panel'); fetchOrders() }
      else window.location.href = '/admin/giris'
    }).catch(() => { window.location.href = '/admin/giris' })
  }, [fetchOrders])

  // 60 saniyede bir otomatik yenile (panel açıkken)
  useEffect(() => {
    if (ekran !== 'panel') return
    const interval = setInterval(() => { fetchOrders() }, 60000)
    return () => clearInterval(interval)
  }, [ekran, fetchOrders])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/giris'
  }

  async function durumDegistir(siparisNo, yeniDurum) {
    await fetch(`/api/admin/orders/${siparisNo}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durum: yeniDurum }),
    })
    setSiparisler((prev) =>
      prev.map((s) => s.siparisNo === siparisNo ? { ...s, durum: yeniDurum } : s)
    )
  }

  async function siparisSil(siparisNo) {
    if (!confirm(`${siparisNo} nolu siparişi silmek istediğinize emin misiniz?`)) return
    await fetch(`/api/admin/orders/${siparisNo}`, { method: 'DELETE' })
    setSiparisler((prev) => prev.filter((s) => s.siparisNo !== siparisNo))
  }

  async function kargoTakipKaydet(siparisNo, kargoTakipNo) {
    if (!kargoTakipNo.trim()) return
    await fetch(`/api/admin/orders/${siparisNo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kargoTakipNo: kargoTakipNo.trim() }),
    })
    setSiparisler((prev) =>
      prev.map((s) => s.siparisNo === siparisNo ? { ...s, durum: 'Kargoya Verildi', kargoTakipNo: kargoTakipNo.trim() } : s)
    )
  }

  // Stats
  const bugunStr = new Date().toDateString()
  const bugunSiparisler = siparisler.filter((s) => new Date(s.tarih).toDateString() === bugunStr)
  const bugunGelir = bugunSiparisler.reduce((a, s) => a + s.genelToplam, 0)
  const toplamGelir = siparisler.reduce((a, s) => a + s.genelToplam, 0)

  // Geciken siparişler (24+ saat Hazırlanıyor durumunda)
  const gecikmeEsigi = 24 * 60 * 60 * 1000
  const gecikenSiparisler = siparisler.filter(
    (s) => s.durum === 'Hazırlanıyor' && (Date.now() - new Date(s.tarih).getTime()) > gecikmeEsigi
  )

  // Okunmamış mesajlar
  const okunmamisMesajlar = mesajlar.filter(m => !m.okundu)

  // Kritik stok uyarısı (stok < 5)
  const kritikStokUrunler = adminUrunler.filter((u) => {
    const s = stoklar[String(u.id)] ?? 0
    return s < 5
  }).map((u) => ({ ...u, stok: stoklar[String(u.id)] ?? 0 })).sort((a, b) => a.stok - b.stok)

  // Filtreli siparişler
  const filtreliSiparisler = siparisler.filter((s) => {
    if (!arama) return true
    const q = arama.toLowerCase()
    return (
      s.siparisNo.toLowerCase().includes(q) ||
      s.musteri.adSoyad.toLowerCase().includes(q) ||
      s.musteri.telefon.includes(q) ||
      s.musteri.email.toLowerCase().includes(q)
    )
  })

  if (ekran === 'yukleniyor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="animate-spin w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-30 shadow-sm">
        {/* Üst satır: logo + yenile + çıkış */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="GAMZELİECZANEM" className="w-8 h-8 rounded-lg object-contain" />
            <div>
              <p className="text-sm font-bold text-stone-900 leading-none">Admin Paneli</p>
              <p className="text-xs text-stone-400 leading-none mt-0.5">GAMZELİECZANEM</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all">
              <svg className={`w-3.5 h-3.5 ${veriYukleniyor ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Yenile</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
        {/* Alt satır: kaydırılabilir sekmeler */}
        <div className="border-t border-stone-100 overflow-x-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5 min-w-max">
            <button onClick={() => setAktifSekme('siparisler')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'siparisler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Siparişler</button>
            <button onClick={() => setAktifSekme('stok')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'stok' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Stok</button>
            <button onClick={() => setAktifSekme('raporlar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'raporlar' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Raporlar</button>
            <button onClick={() => setAktifSekme('urunler')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'urunler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Ürünler</button>
            <button onClick={() => setAktifSekme('yorumlar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'yorumlar' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Yorumlar</button>
            <button onClick={() => setAktifSekme('musteriler')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'musteriler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Müşteriler</button>
            <button onClick={() => setAktifSekme('mesajlar')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'mesajlar' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
              Mesajlar
              {okunmamisMesajlar.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{okunmamisMesajlar.length}</span>
              )}
            </button>
            <button onClick={() => setAktifSekme('bildirimler')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'bildirimler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
              Bildirimler
              {(gecikenSiparisler.length + okunmamisMesajlar.length) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{gecikenSiparisler.length + okunmamisMesajlar.length}</span>
              )}
            </button>
            <button onClick={() => setAktifSekme('iadeler')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${aktifSekme === 'iadeler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
              İadeler
              {iadeler.filter(i => i.durum === 'Beklemede').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {iadeler.filter(i => i.durum === 'Beklemede').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatKart ikon="📦" baslik="Bugünkü Sipariş" deger={bugunSiparisler.length} alt="Bugün" />
          <StatKart ikon="💰" baslik="Bugünkü Gelir" deger={`${bugunGelir.toLocaleString('tr-TR')} ₺`} alt="Bugün" />
          <StatKart ikon="🛒" baslik="Toplam Sipariş" deger={siparisler.length} alt="Tüm zamanlar" />
          <StatKart ikon="📈" baslik="Toplam Gelir" deger={`${toplamGelir.toLocaleString('tr-TR')} ₺`} alt="Tüm zamanlar" />
        </div>

        {/* Kritik Stok Uyarısı */}
        {kritikStokUrunler.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🚨</span>
              <h3 className="text-sm font-bold text-red-700">Kritik Stok Uyarısı — {kritikStokUrunler.length} ürün</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {kritikStokUrunler.slice(0, 12).map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-red-100">
                  <span className="text-xs text-stone-700 font-medium truncate mr-2">{u.ad}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    u.stok === 0 ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {u.stok === 0 ? 'Tükendi' : `${u.stok} adet`}
                  </span>
                </div>
              ))}
            </div>
            {kritikStokUrunler.length > 12 && (
              <p className="text-xs text-red-500 mt-2">+{kritikStokUrunler.length - 12} ürün daha...</p>
            )}
            <button
              onClick={() => setAktifSekme('stok')}
              className="mt-3 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
            >
              Stok Yönetimine Git →
            </button>
          </div>
        )}

        {/* Stok Yönetimi */}
        {aktifSekme === 'stok' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Stok Yönetimi</h2>
            <StokYonetimi adminUrunler={adminUrunler} />
          </div>
        )}

        {/* Raporlar */}
        {aktifSekme === 'raporlar' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Satış Raporları</h2>
            <RaporlarSekme siparisler={siparisler} adminUrunler={adminUrunler} />
          </div>
        )}

        {/* Ürünler */}
        {aktifSekme === 'urunler' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Ürün Yönetimi</h2>
            <UrunlerSekme />
          </div>
        )}

        {/* Siparişler */}
        {aktifSekme === 'siparisler' && (
        <div className="space-y-4">
          {gecikenSiparisler.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-bold text-red-700 text-sm">{gecikenSiparisler.length} sipariş 24+ saattir kargoya verilmedi!</p>
                <p className="text-xs text-red-500 mt-0.5">
                  {gecikenSiparisler.map(s => s.siparisNo).join(', ')}
                </p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Siparişler
              <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded-full">{siparisler.length}</span>
            </h2>
            <input
              type="text"
              placeholder="Sipariş no, isim, telefon ara..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
            />
          </div>

          {veriYukleniyor ? (
            <div className="py-16 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" />
            </div>
          ) : filtreliSiparisler.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">{arama ? 'Sonuç bulunamadı' : 'Henüz sipariş yok'}</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filtreliSiparisler.map((siparis) => (
                <div key={siparis.siparisNo}>
                  {/* Satır */}
                  <div
                    className={`grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 sm:px-6 py-4 hover:bg-rose-50/40 transition-colors cursor-pointer ${siparis.durum === 'İptal Talebi' ? 'bg-orange-50/60' : gecikenSiparisler.find(g => g.siparisNo === siparis.siparisNo) ? 'bg-red-50/60' : ''}`}
                    onClick={() => setAcikId(acikId === siparis.siparisNo ? null : siparis.siparisNo)}
                  >
                    {/* Tarih — sadece büyük ekranda */}
                    <div className="hidden sm:block">
                      <p className="text-xs text-stone-400">{new Date(siparis.tarih).toLocaleDateString('tr-TR')}</p>
                      <p className="text-xs text-stone-400">{new Date(siparis.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Müşteri + Sipariş No */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{siparis.musteri.adSoyad}</p>
                      <p className="text-xs text-rose-500 font-mono">{siparis.siparisNo}</p>
                      {gecikenSiparisler.find(g => g.siparisNo === siparis.siparisNo) && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">⏰ Gecikiyor</span>
                      )}
                      <p className="text-xs text-stone-400 sm:hidden">{new Date(siparis.tarih).toLocaleDateString('tr-TR')}</p>
                    </div>

                    {/* Telefon — sadece büyük ekranda */}
                    <p className="hidden sm:block text-sm text-stone-500">{siparis.musteri.telefon}</p>

                    {/* Tutar */}
                    <p className="text-sm font-bold text-stone-900 text-right sm:text-left">{siparis.genelToplam.toLocaleString('tr-TR')} ₺</p>

                    {/* Durum + Sil */}
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                      {siparis.durum === 'İptal Talebi' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border ${DURUM_STIL['İptal Talebi']}`}>
                            İptal Talebi
                          </span>
                          <button
                            onClick={() => durumDegistir(siparis.siparisNo, 'İptal Edildi')}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => durumDegistir(siparis.siparisNo, 'Hazırlanıyor')}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors"
                          >
                            Reddet
                          </button>
                        </div>
                      ) : (
                        <select
                          value={siparis.durum}
                          onChange={(e) => durumDegistir(siparis.siparisNo, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none ${DURUM_STIL[siparis.durum] ?? 'bg-stone-100 text-stone-600 border-stone-200'}`}
                        >
                          {DURUMLAR.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => siparisSil(siparis.siparisNo)}
                        title="Siparişi sil"
                        className="text-stone-300 hover:text-red-500 transition-colors p-1"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Detay */}
                  {acikId === siparis.siparisNo && <SiparisDetay siparis={siparis} onKargoKaydet={kargoTakipKaydet} />}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
        )}

        {aktifSekme === 'iadeler' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-bold text-stone-900">İade Talepleri <span className="text-stone-400 font-normal text-sm ml-1">{iadeler.length}</span></h2>
            </div>
            {iadeler.length === 0 ? (
              <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Henüz iade talebi yok</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {iadeler.map((iade) => (
                  <div key={iade.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-stone-800">{iade.musteri_ad}</span>
                          <span className="font-mono text-xs text-rose-500">{iade.siparis_no}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            iade.durum === 'Beklemede' ? 'bg-orange-100 text-orange-700' :
                            iade.durum === 'Onaylandı' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-600'
                          }`}>{iade.durum}</span>
                          <span className="text-xs text-stone-400">{new Date(iade.tarih).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-xs text-stone-500 mb-1"><strong>Neden:</strong> {iade.neden}</p>
                        {iade.aciklama && <p className="text-xs text-stone-400 mb-1">{iade.aciklama}</p>}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {iade.urunler?.map((u, i) => (
                            <span key={i} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{u.ad} ×{u.adet}</span>
                          ))}
                        </div>
                      </div>
                      {iade.durum === 'Beklemede' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/iade', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: iade.id, durum: 'Onaylandı' }) })
                              setIadeler(prev => prev.map(i => i.id === iade.id ? { ...i, durum: 'Onaylandı' } : i))
                            }}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >Onayla</button>
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/iade', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: iade.id, durum: 'Reddedildi' }) })
                              setIadeler(prev => prev.map(i => i.id === iade.id ? { ...i, durum: 'Reddedildi' } : i))
                            }}
                            className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >Reddet</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aktifSekme === 'yorumlar' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-bold text-stone-900">Yorumlar <span className="text-stone-400 font-normal text-sm ml-1">{yorumlar.length}</span></h2>
            </div>
            {yorumlar.length === 0 ? (
              <div className="px-6 py-12 text-center text-stone-400 text-sm">📭 Henüz yorum yok</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {yorumlar.map((y) => (
                  <div key={y.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-stone-800">{y.kullanici_adi}</span>
                        <span className="text-amber-400 text-xs">{'★'.repeat(y.puan)}{'☆'.repeat(5 - y.puan)}</span>
                        <span className="text-xs text-stone-400">Ürün #{y.urun_id}</span>
                        <span className="text-xs text-stone-400">{new Date(y.tarih).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <p className="text-sm text-stone-600">{y.yorum}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return
                        await fetch(`/api/reviews/${y.id}`, { method: 'DELETE' })
                        setYorumlar(prev => prev.filter(r => r.id !== y.id))
                      }}
                      title="Yorumu sil"
                      className="text-stone-300 hover:text-red-500 transition-colors p-1 shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aktifSekme === 'musteriler' && (
          <MusterilerSekme musteriler={musteriler} />
        )}

        {aktifSekme === 'mesajlar' && (
          <MesajlarSekme mesajlar={mesajlar} setMesajlar={setMesajlar} />
        )}

        {aktifSekme === 'bildirimler' && (
          <BildirimlerSekme
            gecikenSiparisler={gecikenSiparisler}
            okunmamisMesajlar={okunmamisMesajlar}
            iadeler={iadeler}
            adminUrunler={adminUrunler}
            onSekmeGit={setAktifSekme}
          />
        )}
      </main>
    </div>
  )
}

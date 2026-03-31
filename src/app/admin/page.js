'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { urunler } from '@/lib/data'
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

function LoginEkrani({ onLogin }) {
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sifre }),
    })
    if (res.ok) {
      onLogin()
    } else {
      setHata('Hatalı şifre')
    }
    setYukleniyor(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500 rounded-2xl mb-4 shadow-lg shadow-rose-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Admin Paneli</h1>
          <p className="text-stone-500 text-sm mt-1">GAMZELİECZANEM</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Şifre</label>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="Admin şifresi"
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  hata ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-rose-100'
                }`}
                autoFocus
              />
              {hata && <p className="mt-1.5 text-xs text-red-500">{hata}</p>}
            </div>
            <button
              type="submit"
              disabled={yukleniyor || !sifre}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-all"
            >
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function SiparisDetay({ siparis }) {
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

function StokYonetimi() {
  const [stoklar, setStoklar] = useState({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [guncelleniyor, setGuncelleniyor] = useState(null)
  const [stokArama, setStokArama] = useState('')
  const { refreshStok } = useStock()

  useEffect(() => {
    fetch('/api/stock').then((r) => r.json()).then(setStoklar).finally(() => setYukleniyor(false))
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
    return urunler.filter((u) => !q || u.ad.toLowerCase().includes(q))
  }, [stokArama])

  if (yukleniyor) return <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full" /></div>

  const dusukStokSayisi = urunler.filter((u) => {
    const s = stoklar[String(u.id)] ?? 0
    return s > 0 && s < 5
  }).length
  const stokTukendiSayisi = urunler.filter((u) => (stoklar[String(u.id)] ?? 0) === 0).length

  return (
    <div className="space-y-4">
      {/* Özet */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{urunler.length - stokTukendiSayisi - dusukStokSayisi}</p>
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

function RaporlarSekme({ siparisler }) {
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
        const urunData = urunler.find((ur) => ur.id === u.id)
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

export default function AdminPaneli() {
  const [ekran, setEkran] = useState('yukleniyor') // yukleniyor | login | panel
  const [aktifSekme, setAktifSekme] = useState('siparisler') // siparisler | stok | raporlar
  const [siparisler, setSiparisler] = useState([])
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
    fetch('/api/admin/check').then((r) => {
      if (r.ok) { setEkran('panel'); fetchOrders() }
      else setEkran('login')
    }).catch(() => setEkran('login'))
  }, [fetchOrders])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setEkran('login')
    setSiparisler([])
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

  // Stats
  const bugunStr = new Date().toDateString()
  const bugunSiparisler = siparisler.filter((s) => new Date(s.tarih).toDateString() === bugunStr)
  const bugunGelir = bugunSiparisler.reduce((a, s) => a + s.genelToplam, 0)
  const toplamGelir = siparisler.reduce((a, s) => a + s.genelToplam, 0)

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

  if (ekran === 'login') {
    return <LoginEkrani onLogin={() => { setEkran('panel'); fetchOrders() }} />
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900 leading-none">Admin Paneli</p>
              <p className="text-xs text-stone-400 leading-none mt-0.5">GAMZELİECZANEM</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAktifSekme('siparisler')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${aktifSekme === 'siparisler' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Siparişler</button>
            <button onClick={() => setAktifSekme('stok')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${aktifSekme === 'stok' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Stok</button>
            <button onClick={() => setAktifSekme('raporlar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${aktifSekme === 'raporlar' ? 'bg-rose-500 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Raporlar</button>
            <button onClick={fetchOrders} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-all">
              <svg className={`w-3.5 h-3.5 ${veriYukleniyor ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış
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

        {/* Stok Yönetimi */}
        {aktifSekme === 'stok' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Stok Yönetimi</h2>
            <StokYonetimi />
          </div>
        )}

        {/* Raporlar */}
        {aktifSekme === 'raporlar' && (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Satış Raporları</h2>
            <RaporlarSekme siparisler={siparisler} />
          </div>
        )}

        {/* Siparişler */}
        {aktifSekme === 'siparisler' && <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
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
                    className={`grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 sm:px-6 py-4 hover:bg-rose-50/40 transition-colors cursor-pointer ${siparis.durum === 'İptal Talebi' ? 'bg-orange-50/60' : ''}`}
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
                      <p className="text-xs text-stone-400 sm:hidden">{new Date(siparis.tarih).toLocaleDateString('tr-TR')}</p>
                    </div>

                    {/* Telefon — sadece büyük ekranda */}
                    <p className="hidden sm:block text-sm text-stone-500">{siparis.musteri.telefon}</p>

                    {/* Tutar */}
                    <p className="text-sm font-bold text-stone-900 text-right sm:text-left">{siparis.genelToplam.toLocaleString('tr-TR')} ₺</p>

                    {/* Durum */}
                    <div onClick={(e) => e.stopPropagation()}>
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
                    </div>
                  </div>

                  {/* Detay */}
                  {acikId === siparis.siparisNo && <SiparisDetay siparis={siparis} />}
                </div>
              ))}
            </div>
          )}
        </div>}
      </main>
    </div>
  )
}

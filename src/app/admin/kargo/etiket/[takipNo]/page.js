'use client'
import { useEffect, useState, use } from 'react'

/**
 * Kargo etiketi — yazdırılabilir sayfa.
 * Admin "Kargo Barkodu Oluştur"dan sonra yeni sekmede açar,
 * Ctrl+P / "Yazdır" butonu ile koli üstüne yapıştırmak üzere basar.
 *
 * Yurtiçi kuryesi takip no'yu okur; gerçek entegrasyonda Yurtiçi'nin
 * kendi PDF URL'ini queryShipment ile çekip iframe'leyebiliriz.
 *
 * Barkod görsel olarak Code39 benzeri bar çubukları ile gösterilir
 * (kurye okutacak olan rakam zaten alt satırda büyükçe basılıdır).
 */

// Code39 karakter pattern'leri (1=geniş, 0=dar) — bar,space,bar,space,bar,space,bar,space,bar
const CODE39 = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100',
  'A': '100001001', 'B': '001001001', 'C': '101001000', 'D': '000011001',
  'E': '100011000', 'F': '001011000', 'G': '000001101', 'H': '100001100',
  'I': '001001100', 'J': '000011100', 'K': '100000011', 'L': '001000011',
  'M': '101000010', 'N': '000010011', 'O': '100010010', 'P': '001010010',
  'Q': '000000111', 'R': '100000110', 'S': '001000110', 'T': '000010110',
  'U': '110000001', 'V': '011000001', 'W': '111000000', 'X': '010010001',
  'Y': '110010000', 'Z': '011010000', '-': '010000101', '*': '010010100',
}

function Barcode({ value }) {
  const text = `*${String(value).toUpperCase()}*`
  const narrow = 2
  const wide = 5
  let x = 0
  const rects = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const pattern = CODE39[ch]
    if (!pattern) continue
    for (let j = 0; j < 9; j++) {
      const w = pattern[j] === '1' ? wide : narrow
      const isBar = j % 2 === 0
      if (isBar) rects.push(<rect key={`${i}-${j}`} x={x} y={0} width={w} height={80} fill="black" />)
      x += w
    }
    x += narrow // karakter arası boşluk
  }
  return (
    <svg width="100%" height="80" viewBox={`0 0 ${x} 80`} preserveAspectRatio="none">
      {rects}
    </svg>
  )
}

export default function KargoEtiketi({ params }) {
  const { takipNo } = use(params)
  const [siparis, setSiparis] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    fetch(`/api/admin/orders/by-takip/${encodeURIComponent(takipNo)}`)
      .then(r => r.ok ? r.json() : r.json().then(j => Promise.reject(j.error || 'Hata')))
      .then(data => setSiparis(data.siparis))
      .catch(e => setHata(typeof e === 'string' ? e : 'Sipariş bulunamadı'))
      .finally(() => setYukleniyor(false))
  }, [takipNo])

  if (yukleniyor) {
    return <div className="p-8 text-center text-gray-500">Yükleniyor…</div>
  }
  if (hata) {
    return <div className="p-8 text-center text-red-600">Hata: {hata}</div>
  }

  const m = siparis?.musteri || {}
  const t = siparis?.teslimat || {}

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:bg-white print:p-0">
      <div className="max-w-[600px] mx-auto bg-white border-2 border-black p-6 print:border-0 print:max-w-none">
        {/* Yazdır butonu — print'te gizli */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h1 className="text-lg font-bold">Kargo Etiketi</h1>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              🖨️ Yazdır
            </button>
            <button
              onClick={() => window.close()}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
            >
              Kapat
            </button>
          </div>
        </div>

        {/* Etiket içeriği */}
        <div className="border-b-2 border-black pb-3 mb-3 flex justify-between items-center">
          <div className="font-bold text-xl">YURTİÇİ KARGO</div>
          <div className="text-xs text-gray-600">Gönderen: Gamzeli Kozmetik</div>
        </div>

        <div className="mb-3">
          <div className="text-[10px] uppercase text-gray-600 tracking-wide">Alıcı</div>
          <div className="font-bold text-base">{m.adSoyad || '-'}</div>
          <div className="text-sm">{t.adres || '-'}</div>
          <div className="text-sm">{t.ilce} / {t.sehir}</div>
          <div className="text-sm">Tel: {m.telefon || '-'}</div>
        </div>

        <div className="border-t-2 border-black pt-3 mb-2">
          <div className="text-[10px] uppercase text-gray-600 tracking-wide mb-1">Takip No</div>
          <div className="bg-white">
            <Barcode value={takipNo} />
          </div>
          <div className="text-center font-mono text-xl font-bold tracking-widest mt-1">
            {takipNo}
          </div>
        </div>

        <div className="border-t border-gray-400 pt-2 flex justify-between text-xs text-gray-700">
          <div>Sipariş No: <span className="font-mono">{siparis?.siparisNo}</span></div>
          <div>Tarih: {siparis?.tarih ? new Date(siparis.tarih).toLocaleDateString('tr-TR') : '-'}</div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A6; margin: 5mm; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}

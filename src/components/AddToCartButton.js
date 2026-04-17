'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useStock } from '@/context/StockContext'
import StokBildirimButton from '@/components/StokBildirimButton'

export default function AddToCartButton({ urun }) {
  const { sepeteEkle, drawerAc } = useCart()
  const { getKalanStok, getDbStok } = useStock()
  const [eklendi, setEklendi] = useState(false)

  const dbStok = getDbStok(urun.id)
  const kalanStok = getKalanStok(urun.id) // DB stok − sepetteki adet
  const dbTukendi = dbStok !== null && dbStok === 0
  const ekleyemez = kalanStok !== null && kalanStok <= 0

  function handleClick() {
    if (ekleyemez) return
    sepeteEkle(urun)
    setEklendi(true)
    drawerAc()
    setTimeout(() => setEklendi(false), 2000)
  }

  // Gerçekten stok bittiğinde: bildirim aboneliği CTA'sı
  if (dbTukendi) {
    return (
      <div className="space-y-3">
        <div className="w-full py-4 px-8 rounded-full font-semibold text-sm tracking-wide bg-stone-100 text-stone-400 text-center">
          Stok Tükendi
        </div>
        <StokBildirimButton urunId={urun.id} />
      </div>
    )
  }

  // DB'de stok var ama kullanıcı hepsini sepete atmış
  if (ekleyemez) {
    return (
      <div className="w-full py-4 px-8 rounded-full font-semibold text-sm tracking-wide bg-amber-50 text-amber-700 border border-amber-200 text-center">
        Tüm stok sepetinizde
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full py-4 px-8 rounded-full font-semibold text-sm tracking-wide transition-all duration-300 ${
        eklendi
          ? 'bg-emerald-500 text-white scale-95'
          : 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-lg hover:shadow-rose-200 active:scale-95'
      }`}
    >
      {eklendi ? '✓ Sepete Eklendi!' : 'Sepete Ekle'}
    </button>
  )
}

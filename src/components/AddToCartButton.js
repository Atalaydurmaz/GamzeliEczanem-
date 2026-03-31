'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useStock } from '@/context/StockContext'
import StokBildirimButton from '@/components/StokBildirimButton'

export default function AddToCartButton({ urun }) {
  const { sepeteEkle } = useCart()
  const { getUrunStok, decrementLocalStok } = useStock()
  const [eklendi, setEklendi] = useState(false)

  const stok = getUrunStok(urun.id)
  const stokTukendi = stok !== null && stok === 0

  function handleClick() {
    if (stokTukendi) return
    sepeteEkle(urun)
    decrementLocalStok(urun.id, 1)
    setEklendi(true)
    setTimeout(() => setEklendi(false), 2000)
  }

  if (stokTukendi) {
    return (
      <div className="space-y-3">
        <div className="w-full py-4 px-8 rounded-full font-semibold text-sm tracking-wide bg-stone-100 text-stone-400 text-center">
          Stok Tükendi
        </div>
        <StokBildirimButton urunId={urun.id} />
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

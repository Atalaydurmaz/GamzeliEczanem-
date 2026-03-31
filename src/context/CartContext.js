'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [sepet, setSepet] = useState([])

  useEffect(() => {
    const kayitliSepet = localStorage.getItem('gamzelieczanem-sepet')
    if (kayitliSepet) {
      try { setSepet(JSON.parse(kayitliSepet)) } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('gamzelieczanem-sepet', JSON.stringify(sepet))
  }, [sepet])

  function sepeteEkle(urun) {
    setSepet((onceki) => {
      const mevcut = onceki.find((item) => item.id === urun.id)
      if (mevcut) {
        return onceki.map((item) =>
          item.id === urun.id ? { ...item, adet: item.adet + 1 } : item
        )
      }
      return [...onceki, { ...urun, adet: 1 }]
    })
  }

  function sepettenCikar(urunId) {
    setSepet((onceki) => onceki.filter((item) => item.id !== urunId))
  }

  function adediGuncelle(urunId, yeniAdet) {
    if (yeniAdet < 1) {
      sepettenCikar(urunId)
      return
    }
    setSepet((onceki) =>
      onceki.map((item) =>
        item.id === urunId ? { ...item, adet: yeniAdet } : item
      )
    )
  }

  function sepetiBosalt() {
    setSepet([])
  }

  const toplamAdet = sepet.reduce((acc, item) => acc + item.adet, 0)
  const toplamFiyat = sepet.reduce((acc, item) => acc + item.fiyat * item.adet, 0)
  const kargoUcreti = toplamFiyat >= 1250 ? 0 : 110

  return (
    <CartContext.Provider
      value={{
        sepet,
        sepeteEkle,
        sepettenCikar,
        adediGuncelle,
        sepetiBosalt,
        toplamAdet,
        toplamFiyat,
        kargoUcreti,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

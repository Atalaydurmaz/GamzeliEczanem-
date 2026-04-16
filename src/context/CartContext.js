'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [hydrated, setHydrated] = useState(false)
  const [sepet, setSepet] = useState([])

  // Mount sonrası localStorage'dan oku + Supabase'den güncel fiyatları al
  useEffect(() => {
    async function hydrate() {
      try {
        const kayitli = localStorage.getItem('gamzelieczanem-sepet')
        if (!kayitli) { setHydrated(true); return }

        const parsed = JSON.parse(kayitli)
        if (!parsed?.length) { setHydrated(true); return }

        // Güncel ürün verilerini API'den çek
        let katalog = []
        try {
          const res = await fetch('/api/products')
          if (res.ok) katalog = await res.json()
        } catch {}

        const katalogMap = Object.fromEntries(katalog.map((u) => [u.id, u]))

        const temiz = parsed
          .map((item) => {
            const id = Number(item.id)
            const urun = katalogMap[id]
            if (!urun) return null // ürün kaldırılmış veya pasife alınmış
            return {
              ...urun, // güncel ad, fiyat, kategori, gorsel vb.
              adet: Math.max(1, Math.floor(Number(item.adet) || 1)),
            }
          })
          .filter(Boolean)
        setSepet(temiz)
      } catch {}
      setHydrated(true)
    }
    hydrate()
  }, [])

  // Hydrate olduktan sonra yaz — boş initial state'i localStorage'a yazmaz
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('gamzelieczanem-sepet', JSON.stringify(sepet))
  }, [sepet, hydrated])

  // ── Çoklu Sekme Senkronizasyonu ───────────────────────────────────────
  //
  // `storage` event: başka bir sekme/pencere localStorage'ı değiştirince
  // SADECE diğer sekmeler bu eventi alır (kendi sekmene gelmez).
  // Bu sayede Tab 2'deki sepet değişikliği Tab 1'e anında yansır.
  //
  // `visibilitychange`: Kullanıcı sekmeye geri döndüğünde localStorage'ı
  // yeniden okur. `storage` event'inin işlenmemiş olduğu edge case'leri
  // (arka plan sekme kısıtlamaları, iOS Safari vb.) için belt-and-suspenders.
  useEffect(() => {
    if (!hydrated) return

    // Cross-tab sync için katalog gerekmez — diğer sekmeden gelen veri zaten
    // o sekmedeki hydrate() tarafından doğrulanmış ve güncel fiyatları içeriyor.
    function sepetParse(raw) {
      try {
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    }

    // Başka sekmedeki localStorage değişikliğini yakala
    function handleStorage(e) {
      if (e.key !== 'gamzelieczanem-sepet') return
      const yeni = sepetParse(e.newValue)
      if (yeni !== null) setSepet(yeni)
    }

    // Sekmeye geri dönüldüğünde localStorage'dan senkronize et
    function handleVisibility() {
      if (document.visibilityState !== 'visible') return
      const yeni = sepetParse(localStorage.getItem('gamzelieczanem-sepet'))
      if (yeni !== null) setSepet(yeni)
    }

    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [hydrated])
  // ─────────────────────────────────────────────────────────────────────

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
    const adet = Math.floor(Number(yeniAdet))
    if (!Number.isFinite(adet) || adet < 1) {
      sepettenCikar(urunId)
      return
    }
    setSepet((onceki) =>
      onceki.map((item) =>
        item.id === urunId ? { ...item, adet } : item
      )
    )
  }

  function sepetiBosalt() {
    setSepet([])
  }

  const toplamAdet = sepet.reduce((acc, item) => acc + item.adet, 0)
  const toplamFiyat = Math.round(sepet.reduce((acc, item) => acc + item.fiyat * item.adet, 0) * 100) / 100
  const kargoUcreti = toplamFiyat >= 1500 ? 0 : 130

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
        hydrated,
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

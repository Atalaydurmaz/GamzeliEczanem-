'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useCart } from '@/context/CartContext'

const StockContext = createContext(null)

export function StockProvider({ children }) {
  // DB'den gelen ham stok (admin panelinin yazdığı hakikat kaynağı).
  const [stoklar, setStoklar] = useState({})
  const { sepet } = useCart()

  const fetchStok = useCallback(async () => {
    try {
      const res = await fetch('/api/stock', { cache: 'no-store' })
      if (res.ok) setStoklar(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchStok() }, [fetchStok])

  // Admin iptal edince / stok güncellenince shop senkron kalsın diye:
  // (1) 60s periyodik poll, (2) sekmeye geri dönüldüğünde anında refetch.
  // 60s tercih edildi: kullanıcı başına saatlik API çağrısını 120→60'a yarıladı,
  // visibilitychange zaten sekmeye dönünce anında senkron sağlıyor.
  useEffect(() => {
    const interval = setInterval(fetchStok, 60000)
    function onVisible() {
      if (document.visibilityState === 'visible') fetchStok()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchStok])

  // DB stoku (ham). ProductCard gibi "az kaldı" rozeti için kullanılır.
  function getDbStok(urunId) {
    const stok = stoklar[String(urunId)]
    return stok === undefined ? null : stok
  }

  // Kalan eklenebilir adet = DB stok − sepette olan adet. Sepet/drawer +
  // butonunda ve AddToCartButton'da bu kullanılır. Poll'dan sonra da
  // deterministic çünkü sepet CartContext'in tek doğru kaynağı.
  function getKalanStok(urunId) {
    const db = getDbStok(urunId)
    if (db === null) return null
    const sepetItem = sepet.find((i) => Number(i.id) === Number(urunId))
    const sepetAdet = sepetItem ? sepetItem.adet : 0
    return Math.max(0, db - sepetAdet)
  }

  // Geri uyumluluk: eski API çağrıları kalanStok'u döndürsün ki CartDrawer +
  // butonunun davranışı bozulmasın. decrement/increment artık no-op —
  // sepet değiştikçe kalanStok otomatik hesaplanır.
  const getUrunStok = getKalanStok
  const noop = () => {}

  return (
    <StockContext.Provider
      value={{
        getUrunStok,
        getKalanStok,
        getDbStok,
        decrementLocalStok: noop,
        incrementLocalStok: noop,
        refreshStok: fetchStok,
      }}
    >
      {children}
    </StockContext.Provider>
  )
}

export function useStock() {
  return useContext(StockContext)
}

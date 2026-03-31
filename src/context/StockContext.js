'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const StockContext = createContext(null)

export function StockProvider({ children }) {
  const [stoklar, setStoklar] = useState({})

  const fetchStok = useCallback(async () => {
    try {
      const res = await fetch('/api/stock')
      if (res.ok) setStoklar(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchStok() }, [fetchStok])

  function getUrunStok(urunId) {
    const stok = stoklar[String(urunId)]
    return stok === undefined ? null : stok
  }

  function decrementLocalStok(urunId, adet = 1) {
    setStoklar((prev) => {
      const mevcutStok = prev[String(urunId)] ?? 0
      return { ...prev, [String(urunId)]: Math.max(0, mevcutStok - adet) }
    })
  }

  return (
    <StockContext.Provider value={{ getUrunStok, decrementLocalStok, refreshStok: fetchStok }}>
      {children}
    </StockContext.Provider>
  )
}

export function useStock() {
  return useContext(StockContext)
}

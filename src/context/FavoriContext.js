'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const FavoriContext = createContext(null)

export function FavoriProvider({ children }) {
  const [favoriler, setFavoriler] = useState([])

  useEffect(() => {
    try {
      const kayitli = localStorage.getItem('gec_favoriler')
      if (kayitli) setFavoriler(JSON.parse(kayitli))
    } catch {}
  }, [])

  function favoriEkle(urun) {
    setFavoriler((prev) => {
      const yeni = [...prev, urun]
      localStorage.setItem('gec_favoriler', JSON.stringify(yeni))
      return yeni
    })
  }

  function favoriKaldir(urunId) {
    setFavoriler((prev) => {
      const yeni = prev.filter((u) => u.id !== urunId)
      localStorage.setItem('gec_favoriler', JSON.stringify(yeni))
      return yeni
    })
  }

  function favoriMi(urunId) {
    return favoriler.some((u) => u.id === urunId)
  }

  function favoriToggle(urun) {
    if (favoriMi(urun.id)) favoriKaldir(urun.id)
    else favoriEkle(urun)
  }

  return (
    <FavoriContext.Provider value={{ favoriler, favoriEkle, favoriKaldir, favoriMi, favoriToggle }}>
      {children}
    </FavoriContext.Provider>
  )
}

export function useFavori() {
  const ctx = useContext(FavoriContext)
  if (!ctx) {
    // Provider dışında çağrılırsa boş fallback döndür (crash etme)
    return { favoriler: [], favoriEkle: () => {}, favoriKaldir: () => {}, favoriMi: () => false, favoriToggle: () => {} }
  }
  return ctx
}

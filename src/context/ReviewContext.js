'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ReviewContext = createContext(null)

export function ReviewProvider({ children }) {
  const [stats, setStats] = useState({}) // { [urunId]: { puan, yorumSayisi } }

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews/stats')
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  function getUrunStats(urunId) {
    return stats[String(urunId)] ?? null
  }

  return (
    <ReviewContext.Provider value={{ getUrunStats, refreshStats: fetchStats }}>
      {children}
    </ReviewContext.Provider>
  )
}

export function useReviews() {
  const ctx = useContext(ReviewContext)
  if (!ctx) throw new Error('useReviews must be used within ReviewProvider')
  return ctx
}

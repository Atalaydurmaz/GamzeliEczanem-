'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Scroll pozisyonunu kaydet/geri yükle.
// Ürün listesi → detay → geri tuşu senaryosu için.
export default function ScrollRestorer() {
  const pathname = usePathname()
  const lastPathname = useRef(null)

  useEffect(() => {
    // Sayfa değişmeden önce scroll pozisyonunu kaydet
    const prev = lastPathname.current
    if (prev && prev !== pathname) {
      // Bu zaten bir değişiklik — önceki path için kayıt zaten yapıldı
    }
    lastPathname.current = pathname

    // Mount: kaydedilmiş pozisyon varsa geri yükle
    const key = 'scroll:' + pathname
    const saved = sessionStorage.getItem(key)
    if (saved) {
      const y = parseInt(saved, 10)
      // Kısa gecikme: Next.js render'ı tamamlayana kadar bekle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: 'instant' })
        })
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    // Scroll pozisyonunu sürekli kaydet (passive, throttled)
    let ticking = false
    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          sessionStorage.setItem('scroll:' + pathname, window.scrollY.toString())
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      // Sayfa değişmeden önce son pozisyonu kaydet (hızlı scroll+tıklama durumu)
      sessionStorage.setItem('scroll:' + pathname, window.scrollY.toString())
    }
  }, [pathname])

  return null
}

'use client'

import { useEffect } from 'react'

/**
 * Ödeme başarı sayfasına ulaşıldığında sessionStorage'daki
 * iyzico 3DS kurtarma snapshot'ını temizler.
 * Böylece başarılı ödeme sonrası /sepet sayfasında kurtarma
 * banner'ı gösterilmez.
 */
export default function OdemeSnapshotTemizle() {
  useEffect(() => {
    try {
      sessionStorage.removeItem('gec_odeme_snapshot')
    } catch {}
  }, [])

  return null
}

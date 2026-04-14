'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Tarayıcı kapanınca admin oturumunu zorla kapatır.
 *
 * Sorun: Chrome/Firefox "Continue where you left off" özelliği açık olduğunda
 * session cookie'ler bile restore edilir — bu yüzden HTTP cookie tek başına
 * "tarayıcı kapanınca çıkış" için yetmez.
 *
 * Çözüm: sessionStorage tarayıcı tamamen kapanınca GERÇEKTEN silinir
 * ("restore" özelliği sessionStorage'ı geri getirmez).
 *
 * Akış:
 *   1. Başarılı girişte /admin/giris sayfası bu marker'ı set eder
 *   2. Admin sayfası mount olduğunda marker yoksa → logout + girişe yönlendir
 *   3. Marker varsa normal akış devam
 */
export default function AdminSessionGuard() {
  const pathname = usePathname()

  useEffect(() => {
    // /admin/giris sayfasında guard çalışmasın — sonsuz loop olur
    if (pathname === '/admin/giris') return

    const marker = sessionStorage.getItem('gla_admin_session')
    if (marker === '1') return // aynı tarayıcı oturumunda, devam

    // sessionStorage boş = yeni tarayıcı oturumu (browser restart sonrası)
    // Cookie hala orada olabilir (browser restore) — server tarafında da sil.
    fetch('/api/admin/logout', { method: 'POST' }).finally(() => {
      window.location.replace('/admin/giris')
    })
  }, [pathname])

  return null
}

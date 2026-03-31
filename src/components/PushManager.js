'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'

const DELAY_MS = 5 * 1000 // 5 saniye (test)
const LS_FIRE_AT = 'ge-abandon-at'
const LS_SUBSCRIBED = 'ge-push-subscribed'

function urlB64ToUint8(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

async function getOrCreateSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!key) return null
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8(key),
    })
  }
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  })
  localStorage.setItem(LS_SUBSCRIBED, '1')
  return sub
}

async function triggerAbandonmentPush() {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🛒 Sepetiniz sizi bekliyor!',
        body: 'Seçtiğiniz ürünler hâlâ sepetinizde. Hemen tamamlayın!',
      }),
    })
  } catch {}
}

export default function PushManager() {
  const { sepet } = useCart()
  const pathname = usePathname()
  const timerRef = useRef(null)

  // Service worker kayıt
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Ödeme sayfasına geçince sayacı sıfırla
  useEffect(() => {
    if (pathname === '/odeme' || pathname === '/odeme/basarili') {
      localStorage.removeItem(LS_FIRE_AT)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [pathname])

  // Sayfa ilk yüklendiğinde geçmiş zamanlı terk etme kontrolü
  useEffect(() => {
    const fireAt = localStorage.getItem(LS_FIRE_AT)
    if (fireAt && sepet.length > 0 && Date.now() >= parseInt(fireAt, 10)) {
      localStorage.removeItem(LS_FIRE_AT)
      triggerAbandonmentPush()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sepet değişince sayacı yönet
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (sepet.length === 0) {
      localStorage.removeItem(LS_FIRE_AT)
      return
    }

    const setup = async () => {
      if (!localStorage.getItem(LS_SUBSCRIBED)) {
        const sub = await getOrCreateSubscription()
        if (!sub) return
      }

      const fireAt = Date.now() + DELAY_MS
      localStorage.setItem(LS_FIRE_AT, String(fireAt))

      timerRef.current = setTimeout(() => {
        localStorage.removeItem(LS_FIRE_AT)
        triggerAbandonmentPush()
      }, DELAY_MS)
    }

    setup()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sepet.length])

  return null
}

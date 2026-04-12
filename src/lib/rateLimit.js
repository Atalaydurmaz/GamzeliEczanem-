// In-memory sliding window rate limiter.
// Vercel'de her function instance ayrı olduğundan bu yöntem instance başına çalışır.
// Küçük/orta ölçekli siteler için Redis olmadan yeterli koruma sağlar.

const store = new Map() // key -> number[] (istek timestamp'leri)

export function getIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limit kontrolü yap ve isteği kaydet.
 * @param {string} key        - Benzersiz anahtar (ör: "iletisim:1.2.3.4")
 * @param {number} limit      - Pencere içinde izin verilen max istek sayısı
 * @param {number} windowMs   - Pencere büyüklüğü (milisaniye)
 * @returns {{ ok: boolean, retryAfterSec?: number }}
 */
export function rateLimit(key, limit, windowMs) {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (store.get(key) || []).filter((t) => t > windowStart)

  if (hits.length >= limit) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { ok: false, retryAfterSec }
  }

  hits.push(now)

  if (hits.length === 0) {
    store.delete(key) // Boş diziyi Map'te tutma
  } else {
    store.set(key, hits)
  }

  return { ok: true }
}

// Periyodik temizlik: 30 dakikada bir çalışır, pencere dışındaki tüm key'leri siler.
// Uzun süre çalışan server instance'larında Map büyümesini engeller.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, hits] of store) {
      // Key'in hangi windowMs'ye ait olduğunu bilmiyoruz, 1 saat geçmişe bak
      const aktif = hits.filter((t) => t > now - 60 * 60 * 1000)
      if (aktif.length === 0) {
        store.delete(key)
      } else {
        store.set(key, aktif)
      }
    }
  }, 30 * 60 * 1000)
}

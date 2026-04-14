// ============================================================
// IP rate limiter.
//
// Redis varsa @upstash/ratelimit sliding window — multi-instance
// güvenli, Vercel serverless'ta da doğru sayar.
// Redis yoksa in-memory Map fallback (lokal dev için).
// ============================================================
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '@/lib/redis'

// ── In-memory fallback (sadece dev için) ────────────────────
const memStore = new Map() // key -> number[]

function memRateLimit(key, limit, windowMs) {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (memStore.get(key) || []).filter((t) => t > windowStart)
  if (hits.length >= limit) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { ok: false, retryAfterSec }
  }
  hits.push(now)
  memStore.set(key, hits)
  return { ok: true }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, hits] of memStore) {
      const aktif = hits.filter((t) => t > now - 60 * 60 * 1000)
      if (aktif.length === 0) memStore.delete(key)
      else memStore.set(key, aktif)
    }
  }, 30 * 60 * 1000)
}

// ── Redis-based limiter ─────────────────────────────────────
// Her (limit, windowMs) kombinasyonu için ayrı Ratelimit instance
const _ratelimiters = new Map()

function getRatelimiter(limit, windowMs) {
  const key = `${limit}:${windowMs}`
  if (_ratelimiters.has(key)) return _ratelimiters.get(key)

  const redis = getRedis()
  if (!redis) return null

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: false,
    prefix: 'gla:rl',
  })
  _ratelimiters.set(key, rl)
  return rl
}

// ── Public API ──────────────────────────────────────────────
export function getIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limit kontrolü — daima Promise döner, await'lenmeli.
 * Redis varsa Upstash üstünden, yoksa in-memory fallback.
 *
 * @param {string} key        - Benzersiz anahtar (ör: "iletisim:1.2.3.4")
 * @param {number} limit      - Max istek sayısı
 * @param {number} windowMs   - Pencere (ms)
 * @returns {Promise<{ ok: boolean, retryAfterSec?: number }>}
 */
export async function rateLimit(key, limit, windowMs) {
  const rl = getRatelimiter(limit, windowMs)
  if (!rl) return memRateLimit(key, limit, windowMs)

  try {
    const res = await rl.limit(key)
    if (res.success) return { ok: true }
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000))
    return { ok: false, retryAfterSec }
  } catch (err) {
    // Redis down → in-memory fallback (fail-open değil, degrade-gracefully)
    console.warn('[rateLimit] Redis hatası, in-memory fallback:', err?.message)
    return memRateLimit(key, limit, windowMs)
  }
}

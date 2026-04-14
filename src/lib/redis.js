// ============================================================
// Upstash Redis singleton.
//
// Env yoksa null döner — çağıran taraflar in-memory fallback
// kullanmalı. Böylece:
//   - Prod (Vercel): Upstash Redis → multi-instance güvenli
//   - Lokal dev: Upstash env eksikse in-memory Map ile çalışır
//
// Kullanım:
//   import { getRedis } from '@/lib/redis'
//   const redis = getRedis()
//   if (redis) { await redis.set(...) } else { /* fallback */ }
// ============================================================
import 'server-only'
import { Redis } from '@upstash/redis'

let _redis = null
let _checked = false

export function getRedis() {
  if (_checked) return _redis
  _checked = true

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn('[redis] UPSTASH_REDIS_REST_URL/TOKEN eksik — in-memory fallback kullanılacak.')
    return null
  }

  _redis = new Redis({ url, token })
  return _redis
}

export function hasRedis() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

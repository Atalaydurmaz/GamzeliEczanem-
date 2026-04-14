// ============================================================
// Şifre sıfırlama OTP token deposu.
//
// Redis varsa kalıcı (15dk TTL) + multi-instance güvenli.
// Redis yoksa in-memory Map fallback (sunucu restart'ında kaybolur).
// ============================================================
import 'server-only'
import { getRedis } from '@/lib/redis'

const OTP_TTL_SEC = 15 * 60
const MAX_ATTEMPTS = 5
const PREFIX = 'gla:reset:'

// ── In-memory fallback ──────────────────────────────────────
const memTokens = new Map()

function memKey(email) {
  return email.toLowerCase()
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Yeni OTP üret ve depola. Önceki OTP geçersiz olur.
 */
export async function generateResetOtp(email) {
  const otp = genOtp()
  const redis = getRedis()
  const key = PREFIX + email.toLowerCase()

  if (redis) {
    // set + expire atomik değil ama OTP için güvenli (sadece yeni değer)
    await redis.set(key, JSON.stringify({ otp, attempts: 0 }), { ex: OTP_TTL_SEC })
  } else {
    memTokens.set(memKey(email), {
      otp,
      expires: Date.now() + OTP_TTL_SEC * 1000,
      attempts: 0,
    })
  }

  return otp
}

/**
 * OTP doğrula — tek kullanımlık. 5 yanlış denemede token silinir.
 */
export async function validateResetOtp(email, otp) {
  const redis = getRedis()
  const key = PREFIX + email.toLowerCase()
  const input = String(otp).trim()

  if (redis) {
    const raw = await redis.get(key)
    if (!raw) return { ok: false, hata: 'Geçersiz veya süresi dolmuş kod.' }

    // Upstash bazen obje, bazen string döner
    const entry = typeof raw === 'string' ? JSON.parse(raw) : raw
    const attempts = (entry.attempts || 0) + 1

    if (attempts > MAX_ATTEMPTS) {
      await redis.del(key)
      return { ok: false, hata: 'Çok fazla yanlış deneme. Lütfen tekrar talep edin.' }
    }

    if (entry.otp !== input) {
      // TTL'i koru — ttl sıfırlanmasın diye set+ex yerine incrementle yazıyoruz
      const ttl = await redis.ttl(key)
      await redis.set(key, JSON.stringify({ otp: entry.otp, attempts }), {
        ex: ttl > 0 ? ttl : OTP_TTL_SEC,
      })
      const kalan = MAX_ATTEMPTS - attempts
      return { ok: false, hata: `Kod hatalı. ${kalan} deneme hakkınız kaldı.` }
    }

    await redis.del(key) // tek kullanım
    return { ok: true }
  }

  // In-memory fallback
  const mKey = memKey(email)
  const entry = memTokens.get(mKey)
  if (!entry) return { ok: false, hata: 'Geçersiz veya süresi dolmuş kod.' }
  if (Date.now() > entry.expires) {
    memTokens.delete(mKey)
    return { ok: false, hata: 'Kodun süresi doldu. Lütfen tekrar talep edin.' }
  }
  entry.attempts++
  if (entry.attempts > MAX_ATTEMPTS) {
    memTokens.delete(mKey)
    return { ok: false, hata: 'Çok fazla yanlış deneme. Lütfen tekrar talep edin.' }
  }
  if (entry.otp !== input) {
    const kalan = MAX_ATTEMPTS - entry.attempts
    return { ok: false, hata: `Kod hatalı. ${kalan} deneme hakkınız kaldı.` }
  }
  memTokens.delete(mKey)
  return { ok: true }
}

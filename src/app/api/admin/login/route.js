import { setAdminCookie } from '@/lib/adminAuth'
import { getRedis } from '@/lib/redis'

// ============================================================
// Admin brute-force koruması.
//
// Redis varsa: kalıcı sayaç (Vercel multi-instance güvenli).
// Redis yoksa: in-memory Map fallback (lokal dev).
//
// 5 hatalı denemeden sonra IP 15 dakika kilitlenir.
// ============================================================

const MAX_ATTEMPTS = 5
const LOCK_DURATION_SEC = 15 * 60
const PREFIX = 'gla:admin-login:'

// In-memory fallback
const memAttempts = new Map() // ip -> { count, lockedUntil }

function getIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

async function getRecord(ip) {
  const redis = getRedis()
  if (redis) {
    const raw = await redis.get(PREFIX + ip)
    if (!raw) return { count: 0, lockedUntil: 0 }
    const entry = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { count: entry.count || 0, lockedUntil: entry.lockedUntil || 0 }
  }
  return memAttempts.get(ip) || { count: 0, lockedUntil: 0 }
}

async function setRecord(ip, record) {
  const redis = getRedis()
  if (redis) {
    // Kilit süresinden biraz uzun TTL — bekleme süresi dolunca otomatik sıfırlansın
    const ttl = record.lockedUntil > 0
      ? Math.max(60, Math.ceil((record.lockedUntil - Date.now()) / 1000) + 60)
      : LOCK_DURATION_SEC
    await redis.set(PREFIX + ip, JSON.stringify(record), { ex: ttl })
  } else {
    memAttempts.set(ip, record)
  }
}

async function clearRecord(ip) {
  const redis = getRedis()
  if (redis) {
    await redis.del(PREFIX + ip)
  } else {
    memAttempts.delete(ip)
  }
}

export async function POST(req) {
  const ip = getIp(req)
  const now = Date.now()
  const record = await getRecord(ip)

  // Kilit süresi dolmadıysa reddet
  if (record.lockedUntil > now) {
    const kalanDakika = Math.ceil((record.lockedUntil - now) / 60000)
    return Response.json(
      { ok: false, hata: `Çok fazla hatalı deneme. ${kalanDakika} dakika bekleyin.` },
      { status: 429 }
    )
  }

  const { sifre } = await req.json()

  if (sifre !== process.env.ADMIN_PASSWORD) {
    const yeniCount = record.count + 1
    const lockedUntil = yeniCount >= MAX_ATTEMPTS ? now + LOCK_DURATION_SEC * 1000 : 0
    await setRecord(ip, { count: yeniCount, lockedUntil })

    const kalanHak = MAX_ATTEMPTS - yeniCount
    const hata = lockedUntil
      ? 'Çok fazla hatalı deneme. 15 dakika bekleyin.'
      : kalanHak === 1
        ? 'Hatalı şifre. Son 1 deneme hakkınız kaldı.'
        : `Hatalı şifre. ${kalanHak} deneme hakkınız kaldı.`

    return Response.json({ ok: false, hata }, { status: 401 })
  }

  // Başarılı giriş — sayacı sıfırla
  await clearRecord(ip)
  await setAdminCookie()
  return Response.json({ ok: true })
}

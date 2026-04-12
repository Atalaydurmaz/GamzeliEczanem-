import { setAdminCookie } from '@/lib/adminAuth'

// In-memory brute force tracker (per IP)
// Resets on server restart — yeterli for admin login
const attempts = new Map() // ip -> { count, lockedUntil }

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 dakika

function getIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(req) {
  const ip = getIp(req)
  const now = Date.now()
  const record = attempts.get(ip) || { count: 0, lockedUntil: 0 }

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
    const lockedUntil = yeniCount >= MAX_ATTEMPTS ? now + LOCK_DURATION_MS : 0
    attempts.set(ip, { count: yeniCount, lockedUntil })

    const kalanHak = MAX_ATTEMPTS - yeniCount
    const hata = lockedUntil
      ? 'Çok fazla hatalı deneme. 15 dakika bekleyin.'
      : kalanHak === 1
        ? 'Hatalı şifre. Son 1 deneme hakkınız kaldı.'
        : `Hatalı şifre. ${kalanHak} deneme hakkınız kaldı.`

    return Response.json({ ok: false, hata }, { status: 401 })
  }

  // Başarılı giriş — sayacı sıfırla
  attempts.delete(ip)
  await setAdminCookie()
  return Response.json({ ok: true })
}

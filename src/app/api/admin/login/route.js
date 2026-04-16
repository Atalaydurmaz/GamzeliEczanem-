import { timingSafeEqual, randomInt } from 'crypto'
import { setAdminCookie } from '@/lib/adminAuth'
import { getRedis } from '@/lib/redis'
import { sendMail } from '@/lib/notify'

// ============================================================
// Admin brute-force + 2FA (email OTP) koruması.
//
// Adım 1 — Şifre: POST { sifre }
//   • Doğruysa → 6 haneli OTP üret, Redis'e kaydet (5 dk TTL),
//     admin e-postasına gönder, { ok: true, otpGerekli: true } dön.
//   • Yanlışsa → deneme sayacını artır, 5 hatada 15 dk kilitle.
//
// Adım 2 — OTP: POST { otp }
//   • Redis'teki OTP ile eşleşirse → session cookie oluştur.
//   • Eşleşmezse → deneme sayacını artır.
//
// Redis varsa kalıcı (multi-instance güvenli), yoksa in-memory fallback.
// ============================================================

const MAX_ATTEMPTS    = 5
const LOCK_SEC        = 15 * 60
const OTP_TTL_SEC     = 5 * 60
const LOGIN_PREFIX    = 'gla:admin-login:'
const OTP_PREFIX      = 'gla:admin-otp:'
const ADMIN_EMAIL     = process.env.ADMIN_EMAIL || 'destek.gamzelieczanem@gmail.com'

const memAttempts = new Map()
const memOtp      = new Map()

function getIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

// ── Brute-force kayıtları ──────────────────────────────────────────────────
async function getRecord(ip) {
  const redis = getRedis()
  if (redis) {
    const raw = await redis.get(LOGIN_PREFIX + ip)
    if (!raw) return { count: 0, lockedUntil: 0 }
    const entry = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { count: entry.count || 0, lockedUntil: entry.lockedUntil || 0 }
  }
  return memAttempts.get(ip) || { count: 0, lockedUntil: 0 }
}

async function setRecord(ip, record) {
  const redis = getRedis()
  if (redis) {
    const ttl = record.lockedUntil > 0
      ? Math.max(60, Math.ceil((record.lockedUntil - Date.now()) / 1000) + 60)
      : LOCK_SEC
    await redis.set(LOGIN_PREFIX + ip, JSON.stringify(record), { ex: ttl })
  } else {
    memAttempts.set(ip, record)
  }
}

async function clearRecord(ip) {
  const redis = getRedis()
  if (redis) await redis.del(LOGIN_PREFIX + ip)
  else memAttempts.delete(ip)
}

// ── OTP kayıtları ──────────────────────────────────────────────────────────
async function setOtp(ip, code) {
  const redis = getRedis()
  if (redis) {
    await redis.set(OTP_PREFIX + ip, code, { ex: OTP_TTL_SEC })
  } else {
    memOtp.set(ip, { code, exp: Date.now() + OTP_TTL_SEC * 1000 })
  }
}

async function getOtp(ip) {
  const redis = getRedis()
  if (redis) {
    return await redis.get(OTP_PREFIX + ip)
  }
  const entry = memOtp.get(ip)
  if (!entry || Date.now() > entry.exp) return null
  return entry.code
}

async function deleteOtp(ip) {
  const redis = getRedis()
  if (redis) await redis.del(OTP_PREFIX + ip)
  else memOtp.delete(ip)
}

// ── Timing-safe string karşılaştırma ──────────────────────────────────────
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a), 'utf8')
  const bufB = Buffer.from(String(b), 'utf8')
  // Uzunluk farklıysa sahte karşılaştırma yaparak timing sızıntısını önle
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

// ─────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  const ip  = getIp(req)
  const now = Date.now()
  const record = await getRecord(ip)

  if (record.lockedUntil > now) {
    const kalanDakika = Math.ceil((record.lockedUntil - now) / 60000)
    return Response.json(
      { ok: false, hata: `Çok fazla hatalı deneme. ${kalanDakika} dakika bekleyin.` },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))

  // ── Adım 2: OTP doğrulama ────────────────────────────────────────────
  if (body.otp !== undefined) {
    const kayitliOtp = await getOtp(ip)

    if (!kayitliOtp || !safeEqual(String(body.otp).trim(), String(kayitliOtp))) {
      const yeniCount = record.count + 1
      const lockedUntil = yeniCount >= MAX_ATTEMPTS ? now + LOCK_SEC * 1000 : 0
      await setRecord(ip, { count: yeniCount, lockedUntil })

      const hata = lockedUntil
        ? 'Çok fazla hatalı deneme. 15 dakika bekleyin.'
        : 'Hatalı veya süresi dolmuş kod. Tekrar deneyin.'

      return Response.json({ ok: false, hata }, { status: 401 })
    }

    // OTP doğru — tek kullanımlık, hemen sil
    await deleteOtp(ip)
    await clearRecord(ip)
    await setAdminCookie()
    return Response.json({ ok: true })
  }

  // ── Adım 1: Şifre doğrulama ───────────────────────────────────────────
  if (!safeEqual(body.sifre ?? '', process.env.ADMIN_PASSWORD ?? '')) {
    const yeniCount = record.count + 1
    const lockedUntil = yeniCount >= MAX_ATTEMPTS ? now + LOCK_SEC * 1000 : 0
    await setRecord(ip, { count: yeniCount, lockedUntil })

    const kalanHak = MAX_ATTEMPTS - yeniCount
    const hata = lockedUntil
      ? 'Çok fazla hatalı deneme. 15 dakika bekleyin.'
      : kalanHak === 1
        ? 'Hatalı şifre. Son 1 deneme hakkınız kaldı.'
        : `Hatalı şifre. ${kalanHak} deneme hakkınız kaldı.`

    return Response.json({ ok: false, hata }, { status: 401 })
  }

  // Şifre doğru → OTP üret, gönder, bekle
  const otpKod = String(randomInt(100000, 999999))
  await setOtp(ip, otpKod)

  // E-posta gönderimini arka plana at — kullanıcı çok nadiren bekler
  sendMail({
    to: ADMIN_EMAIL,
    subject: `🔐 Admin Giriş Kodu: ${otpKod}`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2 style="color:#e11d48">GAMZELİECZANEM Admin</h2>
        <p>Giriş doğrulama kodunuz:</p>
        <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.2em;color:#1c1917;
                    background:#f5f5f4;padding:1rem 2rem;border-radius:12px;text-align:center;
                    margin:1.5rem 0">
          ${otpKod}
        </div>
        <p style="color:#78716c;font-size:0.9rem">Bu kod 5 dakika geçerlidir. Siz istemediyseniz görmezden gelin.</p>
      </div>
    `,
    context: 'admin-otp',
  }).catch((err) => console.error('[admin/login] OTP e-postası gönderilemedi:', err?.message))

  return Response.json({ ok: true, otpGerekli: true })
}

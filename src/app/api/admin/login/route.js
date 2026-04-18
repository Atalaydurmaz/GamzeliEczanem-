import { timingSafeEqual, randomInt } from 'crypto'
import { setAdminCookie } from '@/lib/adminAuth'
import { getRedis } from '@/lib/redis'
import { sendMail } from '@/lib/notify'

// ============================================================
// Admin giriş + 2FA (email OTP).
//
// Adım 1 — Şifre: POST { sifre }
//   • Doğruysa → 6 haneli OTP üret, Redis/memory'e kaydet (5 dk TTL),
//     admin e-postasına gönder, { ok: true, otpGerekli: true } dön.
//   • Yanlışsa → güvenlik bildirim maili gönder, 401 dön.
//
// Adım 2 — OTP: POST { otp }
//   • OTP ile eşleşirse → session cookie oluştur.
//   • Eşleşmezse → 401 dön.
//
// NOT: Kilitleme mekanizması YOK — hesap asla kilitlenmez.
// Brute-force tespiti yalnızca e-posta bildirimi ile yapılır.
// ============================================================

const OTP_TTL_SEC     = 5 * 60
const OTP_PREFIX      = 'gla:admin-otp:'
const ADMIN_EMAIL     = process.env.ADMIN_EMAIL || 'destek.gamzelieczanem@gmail.com'

const memOtp = new Map()

function getIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
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
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

// ─────────────────────────────────────────────────────────────────────────
export async function POST(req) {
  const ip = getIp(req)
  const body = await req.json().catch(() => ({}))

  // ── Adım 2: OTP doğrulama ────────────────────────────────────────────
  if (body.otp !== undefined) {
    const kayitliOtp = await getOtp(ip)

    if (!kayitliOtp || !safeEqual(String(body.otp).trim(), String(kayitliOtp))) {
      return Response.json(
        { ok: false, hata: 'Hatalı veya süresi dolmuş kod. Tekrar deneyin.' },
        { status: 401 }
      )
    }

    // OTP doğru — tek kullanımlık, hemen sil
    await deleteOtp(ip)
    await setAdminCookie()
    return Response.json({ ok: true })
  }

  // ── Adım 1: Şifre doğrulama ───────────────────────────────────────────
  if (!safeEqual(body.sifre ?? '', process.env.ADMIN_PASSWORD ?? '')) {
    // Güvenlik uyarı maili — her hatalı denemede otomatik gönder
    const userAgent = req.headers.get('user-agent') || 'bilinmiyor'
    const zaman = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    sendMail({
      to: ADMIN_EMAIL,
      subject: '⚠️ Admin Paneli — Hatalı Şifre Denemesi',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#fff7f7;padding:24px;border-radius:12px">
          <h2 style="color:#ea580c;margin:0 0 16px">⚠️ Hatalı Şifre Denemesi</h2>
          <p style="color:#1c1917;margin:0 0 16px">
            Admin paneline <b>hatalı şifre</b> ile giriş denemesi yapıldı.
          </p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden">
            <tr><td style="padding:10px 14px;background:#f5f5f4;font-weight:600;width:40%">Zaman</td><td style="padding:10px 14px">${zaman}</td></tr>
            <tr><td style="padding:10px 14px;background:#f5f5f4;font-weight:600">IP Adresi</td><td style="padding:10px 14px;font-family:monospace">${ip}</td></tr>
            <tr><td style="padding:10px 14px;background:#f5f5f4;font-weight:600">Tarayıcı</td><td style="padding:10px 14px;font-size:12px;color:#78716c;word-break:break-all">${userAgent}</td></tr>
          </table>
          <p style="margin:20px 0 0;color:#78716c;font-size:14px">
            Bu giriş denemesini siz yapmadıysanız, yönetici şifrenizi değiştirmenizi öneririz.
          </p>
        </div>
      `,
      context: 'admin-hatali-sifre',
    }).catch((err) => console.error('[admin/login] Hatalı şifre bildirim maili gönderilemedi:', err?.message))

    return Response.json({ ok: false, hata: 'Hatalı şifre.' }, { status: 401 })
  }

  // Şifre doğru → OTP üret, gönder, bekle
  const otpKod = String(randomInt(100000, 999999))
  await setOtp(ip, otpKod)

  // OTP mailini AWAIT ile gönder — fire-and-forget olursa Next.js dev/edge
  // ortamında request bittikten sonra bağlantı kesilebiliyor. Admin OTP
  // kritik akış olduğu için 1 sn beklemek kabul edilebilir.
  const mailSonuc = await sendMail({
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
  }).catch((err) => {
    console.error('[admin/login] OTP e-postası gönderilemedi:', err?.message)
    return false
  })

  if (!mailSonuc) {
    // Mail gönderilemedi — kodu temizle ve hata dön
    await deleteOtp(ip)
    return Response.json(
      { ok: false, hata: 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, otpGerekli: true })
}

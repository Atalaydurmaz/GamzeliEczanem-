import nodemailer from 'nodemailer'

// ============================================================
// Bildirim katmanı — SMTP (nodemailer) + NetGSM tek noktadan.
//
// Amaç:
//   - Env eksikliği sessizce gömülmesin → açılışta erken hata
//   - Transporter tek instance (her çağrıda yeni connection açma)
//   - Tüm hatalar tek formatta loglansın (debug için aranabilir)
//   - Çağıran kod try/catch'e gömülmesin → fire-and-forget güvenli
// ============================================================

// ── Env doğrulama ───────────────────────────────────────────────
function hasSmtpEnv() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

function hasNetgsmEnv() {
  return Boolean(process.env.NETGSM_USER && process.env.NETGSM_PASS)
}

// ── SMTP transporter (singleton) ────────────────────────────────
let _transporter = null
function getTransporter() {
  if (_transporter) return _transporter
  if (!hasSmtpEnv()) return null

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  return _transporter
}

// ── Mail gönderimi ──────────────────────────────────────────────
/**
 * E-posta gönderir. Env eksikse veya hata olursa false döner — exception fırlatmaz.
 * @param {object} opts
 * @param {string|string[]} opts.to       Alıcı(lar)
 * @param {string}          opts.subject  Konu
 * @param {string}          opts.html     HTML body
 * @param {string}         [opts.from]    Gönderici (default: SMTP_USER, "GAMZELİECZANEM" başlığıyla)
 * @param {string}         [opts.replyTo] Yanıt adresi
 * @param {string}         [opts.context] Log için bağlam (örn. 'siparis-onay', 'iptal-bildirim')
 * @returns {Promise<boolean>} başarılı mı
 */
export async function sendMail({ to, subject, html, from, replyTo, context = 'mail' }) {
  if (!hasSmtpEnv()) {
    console.warn(`[notify:${context}] SMTP env eksik, mail gönderilmedi → to=${to}`)
    return false
  }
  const transporter = getTransporter()
  try {
    await transporter.sendMail({
      from: from || `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
    return true
  } catch (err) {
    console.error(`[notify:${context}] mail hatası → to=${to}:`, err.message)
    return false
  }
}

// ── SMS (NetGSM) ────────────────────────────────────────────────
/**
 * Telefon numarasını NetGSM formatına çevirir: 0532... / +90532... → 90532...
 */
function normalizeGsm(telefon) {
  return String(telefon || '')
    .replace(/\s/g, '')
    .replace(/^\+90/, '90')
    .replace(/^0/, '90')
}

/**
 * NetGSM ile SMS gönderir. Env eksikse veya hata olursa false döner.
 * @param {object} opts
 * @param {string} opts.telefon  Alıcı GSM (her formatta olabilir)
 * @param {string} opts.mesaj    Mesaj metni
 * @param {string} [opts.header] Gönderici başlık (default: NETGSM_HEADER veya 'A.DURMAZ')
 * @param {string} [opts.context] Log için bağlam
 * @returns {Promise<boolean>}
 */
export async function sendSms({ telefon, mesaj, header, context = 'sms' }) {
  if (!hasNetgsmEnv()) {
    console.warn(`[notify:${context}] NetGSM env eksik, SMS gönderilmedi → tel=${telefon}`)
    return false
  }
  const gsmno = normalizeGsm(telefon)
  if (!gsmno || gsmno.length < 11) {
    console.warn(`[notify:${context}] geçersiz telefon: ${telefon}`)
    return false
  }

  const url = new URL('https://api.netgsm.com.tr/sms/send/get/')
  url.searchParams.set('usercode',  process.env.NETGSM_USER)
  url.searchParams.set('password',  process.env.NETGSM_PASS)
  url.searchParams.set('gsmno',     gsmno)
  url.searchParams.set('message',   mesaj)
  url.searchParams.set('msgheader', header || process.env.NETGSM_HEADER || 'A.DURMAZ')
  url.searchParams.set('filter',    '0')

  try {
    const res = await fetch(url.toString())
    const text = (await res.text()).trim()
    // NetGSM başarı kodu '00' ile başlar
    if (text.startsWith('00')) return true
    console.error(`[notify:${context}] NetGSM hata kodu → ${text}`)
    return false
  } catch (err) {
    console.error(`[notify:${context}] SMS hatası → tel=${gsmno}:`, err.message)
    return false
  }
}

// ── Env durumu (health check / startup log için) ────────────────
export function notifyHealth() {
  return {
    smtp:   hasSmtpEnv(),
    netgsm: hasNetgsmEnv(),
  }
}

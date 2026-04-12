// Şifre sıfırlama OTP token deposu — sunucu yeniden başladığında temizlenir.
// Küçük site için yeterli; production'da Redis tercih edilir.
const tokens = new Map()
const OTP_TTL_MS = 15 * 60 * 1000 // 15 dakika
const MAX_ATTEMPTS = 5

/**
 * Verilen e-posta için 6 haneli OTP üretir ve depolar.
 * Her yeni çağrı önceki token'ı geçersiz kılar.
 */
export function generateResetOtp(email) {
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  tokens.set(email.toLowerCase(), {
    otp,
    expires: Date.now() + OTP_TTL_MS,
    attempts: 0,
  })
  return otp
}

/**
 * OTP'yi doğrular. Doğrulama sonrası token silinir (tek kullanım).
 * @returns {{ ok: boolean, hata?: string }}
 */
export function validateResetOtp(email, otp) {
  const entry = tokens.get(email.toLowerCase())
  if (!entry) return { ok: false, hata: 'Geçersiz veya süresi dolmuş kod.' }
  if (Date.now() > entry.expires) {
    tokens.delete(email.toLowerCase())
    return { ok: false, hata: 'Kodun süresi doldu. Lütfen tekrar talep edin.' }
  }
  entry.attempts++
  if (entry.attempts > MAX_ATTEMPTS) {
    tokens.delete(email.toLowerCase())
    return { ok: false, hata: 'Çok fazla yanlış deneme. Lütfen tekrar talep edin.' }
  }
  if (entry.otp !== String(otp).trim()) {
    const kalan = MAX_ATTEMPTS - entry.attempts
    return { ok: false, hata: `Kod hatalı. ${kalan} deneme hakkınız kaldı.` }
  }
  tokens.delete(email.toLowerCase()) // tek kullanım
  return { ok: true }
}

import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { setUserSessionCookie } from '@/lib/userAuth'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { parseBody, LoginSchema } from '@/lib/validate'

export async function POST(req) {
  // Rate limit: IP başına 15 dakikada 15 giriş denemesi
  const ip = getIp(req)
  const rl = rateLimit(`login:${ip}`, 15, 15 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { basarili: false, hata: `Çok fazla giriş denemesi. ${Math.ceil(rl.retryAfterSec / 60)} dakika sonra tekrar deneyin.` },
      { status: 429 }
    )
  }

  const parsed = await parseBody(LoginSchema, req)
  if (!parsed.ok) return parsed.response
  const { email, sifre } = parsed.data

  const { data: uye } = await supabaseAdmin
    .from('users')
    .select('id, ad, email, sifre_hash, onaylar, kayit_tarihi')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (!uye) {
    return Response.json({ basarili: false, hata: 'E-posta veya şifre hatalı.' }, { status: 401 })
  }

  // Google ile kayıt olmuş — şifresi yok
  if (!uye.sifre_hash) {
    return Response.json({
      basarili: false,
      googleHesabi: true,
      hata: 'Bu hesap Google ile oluşturulmuş. Lütfen "Google ile Giriş Yap" butonunu kullanın.',
    }, { status: 401 })
  }

  const eslesme = await bcrypt.compare(sifre, uye.sifre_hash)
  if (!eslesme) {
    return Response.json({ basarili: false, hata: 'E-posta veya şifre hatalı.' }, { status: 401 })
  }

  const { sifre_hash: _, ...guvenliUye } = uye
  await setUserSessionCookie(uye.email)
  return Response.json({ basarili: true, kullanici: guvenliUye })
}

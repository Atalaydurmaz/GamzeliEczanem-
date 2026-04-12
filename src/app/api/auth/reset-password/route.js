import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { validateResetOtp } from '@/lib/resetTokens'

export async function POST(req) {
  const body = await req.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const { yeniSifre, token } = body

  if (!email || !yeniSifre || !token) {
    return Response.json({ basarili: false, hata: 'E-posta, doğrulama kodu ve yeni şifre zorunludur.' }, { status: 400 })
  }

  const SIFRE_RE = /^(?=.*[a-zA-ZğüşıöçĞÜŞİÖÇ])(?=.*\d).{8,32}$/
  if (!SIFRE_RE.test(yeniSifre)) {
    return Response.json({ basarili: false, hata: 'Şifreniz 8-32 karakter arasında olmalı, en az bir harf ve rakam içermelidir.' }, { status: 400 })
  }

  // OTP doğrula — yanlış veya süresi dolmuşsa hata döndür
  const dogrulama = validateResetOtp(email, token)
  if (!dogrulama.ok) {
    return Response.json({ basarili: false, hata: dogrulama.hata }, { status: 401 })
  }

  const { data: uye } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!uye) {
    return Response.json({ basarili: false, hata: 'Hesap bulunamadı.' }, { status: 404 })
  }

  const sifreHash = await bcrypt.hash(yeniSifre, 10)

  const { error } = await supabaseAdmin
    .from('users')
    .update({ sifre_hash: sifreHash })
    .eq('id', uye.id)

  if (error) {
    return Response.json({ basarili: false, hata: 'Şifre güncellenemedi.' }, { status: 500 })
  }

  return Response.json({ basarili: true })
}

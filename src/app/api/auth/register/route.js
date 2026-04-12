import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { parseBody, RegisterSchema } from '@/lib/validate'

export async function POST(req) {
  // Rate limit: IP başına saatte 10 kayıt denemesi
  const ip = getIp(req)
  const rl = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { basarili: false, hata: 'Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.' },
      { status: 429 }
    )
  }

  const parsed = await parseBody(RegisterSchema, req)
  if (!parsed.ok) return parsed.response
  const { ad, email, sifre, onaylar } = parsed.data

  // Mevcut kullanıcı kontrolü
  const { data: mevcut } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (mevcut) {
    return Response.json({ basarili: false, hata: 'Bu e-posta adresi zaten kayıtlı.' }, { status: 409 })
  }

  const sifreHash = await bcrypt.hash(sifre, 10)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      ad,
      email: email.toLowerCase(),
      sifre_hash: sifreHash,
      onaylar: {
        email: !!onaylar?.email,
        sms: !!onaylar?.sms,
        telefon: !!onaylar?.telefon,
      },
    })
    .select('id, ad, email, onaylar, kayit_tarihi')
    .single()

  if (error) {
    return Response.json({ basarili: false, hata: 'Kayıt oluşturulamadı.' }, { status: 500 })
  }

  return Response.json({ basarili: true, kullanici: data }, { status: 201 })
}

import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Google hesabı için ilk şifre belirleme — aktif NextAuth oturumu gerektirir
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ basarili: false, hata: 'Bu işlem için Google ile giriş yapılmış olması gerekir.' }, { status: 401 })
  }

  const body = await req.json()
  const yeniSifre = typeof body.yeniSifre === 'string' ? body.yeniSifre : ''
  const email = session.user.email.toLowerCase()

  if (!yeniSifre) {
    return Response.json({ basarili: false, hata: 'Yeni şifre zorunludur.' }, { status: 400 })
  }

  const SIFRE_RE = /^(?=.*[a-zA-ZğüşıöçĞÜŞİÖÇ])(?=.*\d).{8,32}$/
  if (!SIFRE_RE.test(yeniSifre)) {
    return Response.json({ basarili: false, hata: 'Şifreniz 8-32 karakter arasında olmalı, en az bir harf ve rakam içermelidir.' }, { status: 400 })
  }

  const { data: uye } = await supabaseAdmin
    .from('users')
    .select('id, sifre_hash')
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
    return Response.json({ basarili: false, hata: 'Şifre kaydedilemedi.' }, { status: 500 })
  }

  return Response.json({ basarili: true })
}

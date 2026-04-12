import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUserEmail } from '@/lib/userAuth'

export async function PATCH(req) {
  // Session doğrula — giriş yapılmamışsa reddet
  const sessionEmail = await getCurrentUserEmail()
  if (!sessionEmail) {
    return Response.json({ basarili: false, hata: 'Giriş gerekli.' }, { status: 401 })
  }

  const { id, ad, onaylar, yeniSifre, eskiSifre } = await req.json()
  if (!id) return Response.json({ basarili: false, hata: 'Kullanıcı ID gerekli.' }, { status: 400 })

  // Oturum sahibinin kendi hesabını güncellediğini doğrula
  const { data: sessionUye } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', sessionEmail)
    .maybeSingle()

  if (!sessionUye || sessionUye.id !== id) {
    return Response.json({ basarili: false, hata: 'Yetkisiz.' }, { status: 403 })
  }

  const guncelleme = {}

  if (ad !== undefined) {
    const temizAd = typeof ad === 'string' ? ad.trim().slice(0, 100) : ''
    if (!temizAd) return Response.json({ basarili: false, hata: 'Ad boş olamaz.' }, { status: 400 })
    guncelleme.ad = temizAd
  }

  if (onaylar !== undefined) {
    if (typeof onaylar !== 'object' || Array.isArray(onaylar)) {
      return Response.json({ basarili: false, hata: 'Geçersiz onay formatı.' }, { status: 400 })
    }
    guncelleme.onaylar = onaylar
  }

  // Şifre değiştirme
  if (yeniSifre) {
    const SIFRE_RE = /^(?=.*[a-zA-ZğüşıöçĞÜŞİÖÇ])(?=.*\d).{8,32}$/
    if (typeof yeniSifre !== 'string' || !SIFRE_RE.test(yeniSifre)) {
      return Response.json({ basarili: false, hata: 'Şifreniz 8-32 karakter arasında olmalı, en az bir harf ve rakam içermelidir.' }, { status: 400 })
    }
    const { data: uye } = await supabaseAdmin
      .from('users').select('sifre_hash').eq('id', id).maybeSingle()
    if (!uye) return Response.json({ basarili: false, hata: 'Kullanıcı bulunamadı.' }, { status: 404 })
    const dogru = await bcrypt.compare(eskiSifre ?? '', uye.sifre_hash ?? '')
    if (!dogru) return Response.json({ basarili: false, hata: 'Mevcut şifre hatalı.' }, { status: 401 })
    guncelleme.sifre_hash = await bcrypt.hash(yeniSifre, 10)
  }

  if (Object.keys(guncelleme).length === 0) {
    return Response.json({ basarili: false, hata: 'Güncellenecek alan yok.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(guncelleme)
    .eq('id', id)
    .select('id, ad, email, onaylar, kayit_tarihi')
    .single()

  if (error) return Response.json({ basarili: false, hata: 'Güncelleme başarısız.' }, { status: 500 })

  return Response.json({ basarili: true, kullanici: data })
}

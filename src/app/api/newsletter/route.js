import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/notify'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function POST(req) {
  // Rate limit: IP başına saatte 3 istek (spam önlemi)
  const ip = getIp(req)
  const rl = await rateLimit(`newsletter:${ip}`, 3, 60 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
      { status: 429 }
    )
  }

  let email
  try {
    const body = await req.json()
    email = (body.email || '').trim().toLowerCase()
  } catch {
    return Response.json({ ok: false, error: 'Geçersiz istek.' }, { status: 400 })
  }

  // Basit format kontrolü
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: 'Geçerli bir e-posta adresi girin.' }, { status: 422 })
  }

  // Supabase'e kaydet — duplicate'i sessizce başarı say (kullanıcı tekrar abone olmaya çalışıyordur)
  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .insert({ email })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // unique violation → zaten abone, başarı gibi dön
      return Response.json({ ok: true, zatenAbone: true })
    }
    console.error('[newsletter] Supabase kayıt hatası:', error.message)
    return Response.json({ ok: false, error: 'Kayıt sırasında bir hata oluştu.' }, { status: 500 })
  }

  // Onay e-postası aboneye gönder (ikincil — başarısız olsa DB kaydı geçerli)
  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:32px">
      <p style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
      <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">Bülten Aboneliği</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1c1917">Hoş geldiniz! 🎉</p>
      <p style="margin:0 0 16px;font-size:14px;color:#44403c;line-height:1.7">
        <strong>${email}</strong> adresiyle GAMZELİECZANEM bültenine başarıyla abone oldunuz.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#44403c;line-height:1.7">
        Artık yeni ürünler, özel kampanyalar ve eczacı önerileri hakkında ilk siz haberdar olacaksınız.
      </p>
      <a href="https://gamzelidermokozmetik.com/urunler"
         style="display:inline-block;background:#f43f5e;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none">
        Alışverişe Başla →
      </a>
    </div>
    <div style="background:#fff1f2;padding:16px 32px;text-align:center;border-top:1px solid #fce7f3">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        Bu e-postayı yanlışlıkla aldıysanız dikkate almayınız. · GAMZELİECZANEM · gamzelidermokozmetik.com
      </p>
    </div>
  </div>
</body>
</html>`

  await sendMail({
    from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'GAMZELİECZANEM Bültenine Hoş Geldiniz 🎉',
    html,
    context: 'newsletter',
  }).catch((err) => console.error('[newsletter] Onay maili gönderilemedi:', err?.message))

  return Response.json({ ok: true })
}

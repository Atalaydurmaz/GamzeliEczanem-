import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabase'
import { generateResetOtp } from '@/lib/resetTokens'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { parseBody, CheckEmailSchema } from '@/lib/validate'

// E-posta adresinin kayıtlı olup olmadığını kontrol et ve OTP gönder
export async function POST(req) {
  // Rate limit: IP başına 15 dakikada 5 şifre sıfırlama isteği
  const ip = getIp(req)
  const rl = rateLimit(`check-email:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { basarili: false, hata: `Çok fazla istek. ${Math.ceil(rl.retryAfterSec / 60)} dakika sonra tekrar deneyin.` },
      { status: 429 }
    )
  }

  const parsed = await parseBody(CheckEmailSchema, req)
  if (!parsed.ok) return parsed.response
  const { email } = parsed.data

  const { data: uye } = await supabaseAdmin
    .from('users')
    .select('id, sifre_hash')
    .eq('email', email)
    .maybeSingle()

  if (!uye) {
    // Kullanıcı numaralandırmasını önlemek için aynı mesaj döndür
    return Response.json({ basarili: true })
  }

  if (!uye.sifre_hash) {
    return Response.json({
      basarili: false,
      googleHesabi: true,
      hata: 'Bu hesap yalnızca Google ile oluşturulmuş. Giriş yaptıktan sonra profilinizden şifre belirleyebilirsiniz.',
    }, { status: 400 })
  }

  const otp = generateResetOtp(email)

  // SMTP yapılandırılmışsa e-posta gönder
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Şifre Sıfırlama Kodunuz',
        html: `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:480px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:32px;text-align:center">
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff">GAMZELİECZANEM</p>
  </div>
  <div style="padding:32px;text-align:center">
    <p style="font-size:15px;color:#78716c;margin:0 0 24px">Şifre sıfırlama isteği aldık. Aşağıdaki kodu girin:</p>
    <div style="background:#fff1f2;border:2px dashed #fecdd3;border-radius:16px;padding:24px;margin-bottom:24px">
      <p style="margin:0;font-size:40px;font-weight:900;color:#f43f5e;letter-spacing:8px">${otp}</p>
    </div>
    <p style="font-size:13px;color:#9ca3af;margin:0">Bu kod 15 dakika geçerlidir. Talepte bulunmadıysanız dikkate almayın.</p>
  </div>
</div></body></html>`,
      })
    } catch (e) {
      console.error('OTP e-posta hatası:', e.message)
      // E-posta hata verse de devam et — development'ta dev_otp dönecek
    }
  }

  // Geliştirme ortamında OTP'yi response'a ekle (production'da hiçbir zaman dönme)
  if (process.env.NODE_ENV !== 'production') {
    return Response.json({ basarili: true, dev_otp: otp })
  }

  return Response.json({ basarili: true })
}

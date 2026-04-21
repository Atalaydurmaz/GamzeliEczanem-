import { sendMail } from '@/lib/notify'
import { createMessage } from '@/lib/messages'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { parseBody, IletisimSchema } from '@/lib/validate'

export async function POST(req) {
  // Rate limit: IP başına 10 dakikada 5 istek
  const ip = getIp(req)
  const rl = await rateLimit(`iletisim:${ip}`, 5, 10 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: `Çok fazla istek. ${Math.ceil(rl.retryAfterSec / 60)} dakika sonra tekrar deneyin.` },
      { status: 429 }
    )
  }

  const parsed = await parseBody(IletisimSchema, req)
  if (!parsed.ok) return parsed.response
  const { ad, email, telefon, konu, mesaj, faxNumber } = parsed.data

  // Honeypot: botlar bu gizli alanı doldurur, insanlar doldurmaz
  if (faxNumber) {
    return Response.json({ ok: true })
  }

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:28px 32px">
      <p style="margin:0;font-size:18px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
      <p style="margin:4px 0 0;font-size:13px;color:#fecdd3">Yeni İletişim Formu Mesajı</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3;width:130px">
            <span style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Ad Soyad</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3">
            <span style="font-size:14px;font-weight:600;color:#1c1917">${ad}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3">
            <span style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">E-posta</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3">
            <a href="mailto:${email}" style="font-size:14px;color:#f43f5e;text-decoration:none;font-weight:600">${email}</a>
          </td>
        </tr>
        ${telefon ? `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3">
            <span style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Telefon</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3">
            <a href="tel:${telefon.replace(/\s/g, '')}" style="font-size:14px;color:#1c1917;text-decoration:none;font-weight:600">${telefon}</a>
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3">
            <span style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Konu</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #fce7f3">
            <span style="display:inline-block;background:#fff1f2;color:#f43f5e;font-size:13px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #fecdd3">${konu}</span>
          </td>
        </tr>
      </table>

      <!-- Mesaj -->
      <div style="margin-top:24px">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Mesaj</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #f43f5e">
          <p style="margin:0;font-size:14px;color:#44403c;line-height:1.8;white-space:pre-wrap">${mesaj}</p>
        </div>
      </div>

      <!-- Yanıtla butonu -->
      <div style="margin-top:24px;text-align:center">
        <a href="mailto:${email}?subject=Re: ${konu}" style="display:inline-block;background:#f43f5e;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none">
          Yanıtla →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#fff1f2;padding:16px 32px;text-align:center;border-top:1px solid #fce7f3">
      <p style="margin:0;font-size:12px;color:#9ca3af">GAMZELİECZANEM · gamzelidermokozmetik.com</p>
    </div>
  </div>
</body>
</html>`

  // Önce Supabase'e kaydet (birincil — e-posta bağımsız çalışır)
  try {
    await createMessage({ ad, email, telefon, konu, mesaj })
  } catch (err) {
    console.error('Mesaj Supabase kaydı başarısız:', err.message)
    return Response.json({ ok: false, error: 'Mesajınız kaydedilemedi.' }, { status: 500 })
  }

  // Sonra e-posta gönder (ikincil — başarısız olsa da 200 dön)
  await sendMail({
    from:    `"GAMZELİECZANEM İletişim" <${process.env.SMTP_USER}>`,
    to:      process.env.SMTP_USER,
    replyTo: `"${ad}" <${email}>`,
    subject: `[İletişim] ${konu} – ${ad}`,
    html,
    context: 'iletisim',
  })

  return Response.json({ ok: true })
}

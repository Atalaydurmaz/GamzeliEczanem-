import nodemailer from 'nodemailer'
import { getDueReminders, markReminderSent } from '@/lib/routineReminders'

const BASE_URL = 'https://gamzelieczanem.com'

function ayMetni(gun) {
  const ay = Math.round(gun / 30)
  if (ay === 1) return '1 ay'
  return `${ay} ay`
}

export async function GET(req) {
  // CRON_SECRET zorunlu — ayarlanmamışsa endpoint'i kapat
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return Response.json({ error: 'CRON_SECRET yapılandırılmamış' }, { status: 503 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const hatirlaticilar = getDueReminders()
  if (hatirlaticilar.length === 0) return Response.json({ gonderilen: 0 })

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  let gonderilen = 0

  await Promise.allSettled(
    hatirlaticilar.map(async (h) => {
      const urunUrl = `${BASE_URL}/urunler/${h.urunId}`
      const sure = ayMetni(h.rafOmruGun)

      const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:540px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:36px 32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">Kişisel Bakım Rutininiz</p>
  </div>

  <div style="padding:32px">
    <p style="margin:0 0 6px;font-size:13px;color:#f43f5e;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Rutin Hatırlatıcı</p>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1c1917">
      ${sure} geçti — yenileme vakti!
    </h1>
    <p style="margin:0 0 24px;color:#78716c;font-size:15px;line-height:1.6">
      Merhaba <strong>${h.adSoyad.split(' ')[0]}</strong>, aşağıdaki ürünü satın alışınızın üzerinden yaklaşık <strong>${sure}</strong> geçti. Ürününüz bitiyor ya da bitmek üzere olabilir — rutin bakımınızı aksatmayın!
    </p>

    <div style="border:1px solid #fce7f3;border-radius:16px;overflow:hidden;margin-bottom:28px">
      ${h.urunGorsel ? `<div style="background:#fff1f2;text-align:center;padding:20px">
        <img src="${h.urunGorsel}" alt="${h.urunAd}" style="max-height:160px;max-width:100%;object-fit:contain;border-radius:8px" />
      </div>` : ''}
      <div style="padding:20px">
        <p style="margin:0 0 6px;font-size:13px;color:#f43f5e;font-weight:600;text-transform:uppercase;letter-spacing:.5px">${h.urunKategori ?? ''}</p>
        <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#1c1917;line-height:1.4">${h.urunAd}</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#f43f5e">${h.urunFiyat.toLocaleString('tr-TR')} ₺</p>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:24px">
      <a href="${urunUrl}" style="display:inline-block;padding:16px 40px;background:#f43f5e;color:#fff;font-weight:700;font-size:15px;border-radius:999px;text-decoration:none;letter-spacing:.3px">
        Aynı Ürünü Yeniden Sipariş Et
      </a>
    </div>

    <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:8px">
      <p style="margin:0;font-size:13px;color:#78716c;line-height:1.6">
        💡 <strong>Neden bu e-postayı aldınız?</strong><br>
        ${h.siparisNo} numaralı siparişinizden bu ürünü aldınız ve ürünün önerilen kullanım süresi yaklaşık ${sure}. Bakım rutininizi kesintisiz sürdürmeniz için hatırlatmak istedik.
      </p>
    </div>
  </div>

  <div style="background:#fff1f2;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3">
    <a href="mailto:destek.gamzelieczanem@gmail.com" style="color:#f43f5e;font-size:13px;font-weight:600;text-decoration:none">destek.gamzelieczanem@gmail.com</a>
    <p style="margin:8px 0 0;font-size:12px;color:#d1d5db">0262 412 6928 · Gölcük / Kocaeli</p>
    <p style="margin:8px 0 0;font-size:11px;color:#e5e7eb">Bu e-postayı almak istemiyorsanız bizimle iletişime geçin.</p>
  </div>

</div></body></html>`

      try {
        await transporter.sendMail({
          from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
          to: h.email,
          subject: `${h.adSoyad.split(' ')[0]}, ${sure} geçti — ${h.urunAd} yenileme vakti! 💆‍♀️`,
          html,
        })
        markReminderSent(h.id)
        gonderilen++
      } catch (e) {
        console.error(`Rutin hatırlatıcı e-posta hatası (${h.email}):`, e.message)
      }
    })
  )

  return Response.json({ gonderilen })
}

import { sendMail } from '@/lib/notify'
import { getAbandonedCarts, markEmailSent } from '@/lib/abandonedCarts'

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

  const terkSepetler = getAbandonedCarts(60) // 1 saat sonra
  if (terkSepetler.length === 0) {
    return Response.json({ gonderilen: 0 })
  }

  let gonderilen = 0

  await Promise.allSettled(
    terkSepetler.map(async (kayit) => {
      const urunSatirlari = kayit.sepet.map((item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;color:#44403c;font-size:14px">${item.ad}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:center;color:#78716c;font-size:14px">${item.adet}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:right;font-weight:600;color:#1c1917;font-size:14px">${(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺</td>
        </tr>`).join('')

      const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:36px 32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">gamzelidermokozmetik.com</p>
  </div>

  <div style="padding:32px">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1c1917">Sepetinizde ürünler bekliyor!</h1>
    <p style="margin:0 0 24px;color:#78716c;font-size:15px">Seçtiğiniz ürünleri sepetinizde unuttunuz gibi görünüyor. Kaçırmadan tamamlayın!</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead>
        <tr style="background:#fff1f2">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">Ürün</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#9ca3af;font-weight:600">Adet</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;font-weight:600">Fiyat</th>
        </tr>
      </thead>
      <tbody>${urunSatirlari}</tbody>
    </table>

    <div style="background:#fff1f2;border-radius:12px;padding:16px 20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:#78716c;font-size:15px;font-weight:600">Toplam</span>
      <span style="color:#f43f5e;font-size:20px;font-weight:800">${kayit.toplamFiyat.toLocaleString('tr-TR')} ₺</span>
    </div>

    <div style="text-align:center">
      <a href="https://gamzelidermokozmetik.com/sepet" style="display:inline-block;padding:16px 40px;background:#f43f5e;color:#fff;font-weight:700;font-size:15px;border-radius:999px;text-decoration:none;letter-spacing:.3px">
        Sepetime Dön &amp; Siparişi Tamamla
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#d1d5db;text-align:center">Stoklar sınırlı olabilir, ürünleriniz başkaları tarafından satın alınabilir.</p>
  </div>

  <div style="background:#fff1f2;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3">
    <a href="mailto:destek@gamzelidermokozmetik.com" style="color:#f43f5e;font-size:13px;font-weight:600;text-decoration:none">destek@gamzelidermokozmetik.com</a>
    <p style="margin:8px 0 0;font-size:12px;color:#d1d5db">0262 412 6928 · Gölcük / Kocaeli</p>
  </div>

</div></body></html>`

      const ok = await sendMail({
        to: kayit.email,
        subject: 'Sepetinizde ürünler sizi bekliyor! 🛒',
        html,
        context: 'terk-sepet',
      })
      if (ok) {
        markEmailSent(kayit.email)
        gonderilen++
      }
    })
  )

  return Response.json({ gonderilen })
}

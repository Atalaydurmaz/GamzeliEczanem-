import { sendMail } from '@/lib/notify'

export async function POST(req) {
  const {
    email, adSoyad, siparisNo, telefon,
    sepet, toplamFiyat, kargoUcreti, genelToplam,
    adres, sehir, ilce, postaKodu,
  } = await req.json()

  const urunSatirlari = sepet.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;color:#44403c">${item.ad}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:center;color:#78716c">${item.adet}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:right;font-weight:600;color:#1c1917">${(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺</td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:36px 32px;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
      <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">gamzelieczanem.com</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1c1917">Siparişiniz Alındı! 🎉</h1>
      <p style="margin:0 0 24px;color:#78716c;font-size:15px">Merhaba <strong>${adSoyad}</strong>, siparişiniz başarıyla oluşturuldu.</p>

      <!-- Sipariş No -->
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Sipariş Numarası</p>
        <p style="margin:0;font-size:24px;font-weight:800;color:#f43f5e;letter-spacing:3px">${siparisNo}</p>
      </div>

      <!-- Ürünler -->
      <h2 style="font-size:14px;font-weight:700;color:#1c1917;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px">Sipariş Detayı</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#fff1f2">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">Ürün</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#9ca3af;font-weight:600">Adet</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;font-weight:600">Fiyat</th>
          </tr>
        </thead>
        <tbody>${urunSatirlari}</tbody>
      </table>

      <!-- Toplam -->
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#78716c;font-size:14px">Ara Toplam</span>
          <span style="color:#44403c;font-size:14px">${toplamFiyat.toLocaleString('tr-TR')} ₺</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb">
          <span style="color:#78716c;font-size:14px">Kargo</span>
          <span style="color:${kargoUcreti === 0 ? '#10b981' : '#44403c'};font-size:14px;font-weight:600">${kargoUcreti === 0 ? 'Ücretsiz' : kargoUcreti.toLocaleString('tr-TR') + ' ₺'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#1c1917;font-size:16px;font-weight:700">Toplam</span>
          <span style="color:#f43f5e;font-size:18px;font-weight:800">${genelToplam.toLocaleString('tr-TR')} ₺</span>
        </div>
      </div>

      <!-- Adres & Ödeme -->
      <div style="display:grid;gap:16px;margin-bottom:24px">
        <div style="background:#f9fafb;border-radius:12px;padding:16px 20px">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Teslimat Adresi</p>
          <p style="margin:0;color:#44403c;font-size:14px;line-height:1.6">${adres}<br>${ilce} / ${sehir} ${postaKodu}</p>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px 20px">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Ödeme Yöntemi</p>
          <p style="margin:0;color:#44403c;font-size:14px;font-weight:600">💵 Kapıda Ödeme</p>
        </div>
      </div>

      <!-- Kargo Bilgisi -->
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;color:#065f46;font-size:14px">🚚 <strong>1–3 iş günü</strong> içinde kargoya verilecek. Kargo takip bilgisi ayrıca iletilecektir.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#fff1f2;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3">
      <p style="margin:0 0 4px;font-size:13px;color:#9ca3af">Sorularınız için</p>
      <a href="mailto:destek@gamzelidermokozmetik.com" style="color:#f43f5e;font-size:13px;font-weight:600;text-decoration:none">destek@gamzelidermokozmetik.com</a>
      <p style="margin:8px 0 0;font-size:12px;color:#d1d5db">0262 412 6928 · Gölcük / Kocaeli</p>
    </div>
  </div>
</body>
</html>`

  const ok = await sendMail({
    to: email,
    subject: `Siparişiniz Alındı – ${siparisNo} 🎉`,
    html,
    context: 'siparis-onay',
  })
  return Response.json({ ok }, { status: ok ? 200 : 500 })
}

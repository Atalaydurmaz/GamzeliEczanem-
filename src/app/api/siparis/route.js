import nodemailer from 'nodemailer'
import { saveOrder } from '@/lib/orders'
import { decrementStock, getLowStockUrunler } from '@/lib/stock'
import { incrementUsage } from '@/lib/discountCodes'
import { deleteAbandonedCart } from '@/lib/abandonedCarts'
import { scheduleReminders } from '@/lib/routineReminders'
import { getRafOmruGun } from '@/lib/rafOmru'
import { urunler } from '@/lib/data'

export async function POST(req) {
  const body = await req.json()
  const {
    email, adSoyad, telefon, siparisNo,
    sepet, toplamFiyat, kargoUcreti, genelToplam,
    adres, sehir, ilce, postaKodu,
    indirimKodu, indirimTutari,
  } = body

  // Stok düşür
  for (const item of sepet) {
    decrementStock(item.id, item.adet)
  }

  // İndirim kodu kullanıldıysa sayacı artır
  if (indirimKodu) incrementUsage(indirimKodu)

  // Terk sepet kaydını sil (sipariş tamamlandı)
  deleteAbandonedCart(email)

  // Rutin hatırlatıcıları planla (her ürün için raf ömrü sonunda e-posta)
  const siparisTarihi = new Date().toISOString()
  scheduleReminders(siparisNo, email, adSoyad, sepet, siparisTarihi, (item) => {
    const urunDetay = urunler.find((u) => u.id === item.id)
    return urunDetay ? getRafOmruGun(urunDetay) : 90
  })

  // Siparişi kaydet
  saveOrder({
    siparisNo,
    tarih: new Date().toISOString(),
    musteri: { adSoyad, email, telefon },
    teslimat: { adres, sehir, ilce, postaKodu },
    urunler: sepet,
    toplamFiyat,
    indirimKodu: indirimKodu || null,
    indirimTutari: indirimTutari || 0,
    kargoUcreti,
    genelToplam,
    odemeYontemi: 'Kredi / Banka Kartı',
    durum: 'Hazırlanıyor',
  })

  // E-posta ve SMS paralel gönder
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const urunSatirlari = sepet.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;color:#44403c">${item.ad}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:center;color:#78716c">${item.adet}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #fce7f3;text-align:right;font-weight:600;color:#1c1917">${(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:580px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:36px 32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">gamzelieczanem.com</p>
  </div>
  <div style="padding:32px">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1c1917">Siparişiniz Alındı! 🎉</h1>
    <p style="margin:0 0 24px;color:#78716c;font-size:15px">Merhaba <strong>${adSoyad}</strong>, siparişiniz başarıyla oluşturuldu.</p>
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Sipariş Numarası</p>
      <p style="margin:0;font-size:24px;font-weight:800;color:#f43f5e;letter-spacing:3px">${siparisNo}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead><tr style="background:#fff1f2">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600">Ürün</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#9ca3af;font-weight:600">Adet</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#9ca3af;font-weight:600">Fiyat</th>
      </tr></thead>
      <tbody>${urunSatirlari}</tbody>
    </table>
    <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#78716c;font-size:14px">Ara Toplam</span><span style="color:#44403c;font-size:14px">${toplamFiyat.toLocaleString('tr-TR')} ₺</span></div>
      ${indirimTutari > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:#10b981;font-size:14px">İndirim (${indirimKodu})</span><span style="color:#10b981;font-size:14px;font-weight:600">-${indirimTutari.toLocaleString('tr-TR')} ₺</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb"><span style="color:#78716c;font-size:14px">Kargo</span><span style="color:${kargoUcreti === 0 ? '#10b981' : '#44403c'};font-size:14px;font-weight:600">${kargoUcreti === 0 ? 'Ücretsiz' : kargoUcreti.toLocaleString('tr-TR') + ' ₺'}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:#1c1917;font-size:16px;font-weight:700">Toplam</span><span style="color:#f43f5e;font-size:18px;font-weight:800">${genelToplam.toLocaleString('tr-TR')} ₺</span></div>
    </div>
    <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:16px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase">Teslimat Adresi</p>
      <p style="margin:0;color:#44403c;font-size:14px;line-height:1.6">${adres}<br>${ilce} / ${sehir} ${postaKodu}</p>
    </div>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px">
      <p style="margin:0;color:#065f46;font-size:14px">🚚 <strong>1–3 iş günü</strong> içinde kargoya verilecek.</p>
    </div>
  </div>
  <div style="background:#fff1f2;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3">
    <a href="mailto:destek@gamzelieczanem.com" style="color:#f43f5e;font-size:13px;font-weight:600;text-decoration:none">destek@gamzelieczanem.com</a>
    <p style="margin:8px 0 0;font-size:12px;color:#d1d5db">0262 412 6928 · Gölcük / Kocaeli</p>
  </div>
</div></body></html>`

  const smsGsmno = telefon.replace(/\s/g, '').replace(/^\+90/, '90').replace(/^0/, '90')
  // Türkçe özel karakter içermeyen mesaj (Netgsm GET API uyumluluğu için)
  const smsMesaj = `GAMZELİECZANEM: Siparişiniz alindi! No: ${siparisNo}, Tutar: ${genelToplam.toFixed(2)} TL. Teşekkürler!`

  // Düşük stok kontrolü
  const dusukStoklar = getLowStockUrunler(5)
  const lowStockMails = dusukStoklar.map(({ id, stok }) => {
    const urun = urunler.find((u) => u.id === id)
    return { ad: urun?.ad ?? `Ürün #${id}`, stok }
  })

  const promises = [
    transporter.sendMail({
      from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Siparişiniz Alındı – ${siparisNo} 🎉`,
      html,
    }).catch((e) => console.error('E-posta hatası:', e.message)),
    fetch(`https://api.netgsm.com.tr/sms/send/get/?usercode=${process.env.NETGSM_USER}&password=${process.env.NETGSM_PASS}&gsmno=${smsGsmno}&message=${encodeURIComponent(smsMesaj)}&msgheader=${encodeURIComponent(process.env.NETGSM_HEADER || 'A.DURMAZ')}&filter=0`)
      .then((r) => r.text()).then((t) => { if (!t.startsWith('00')) console.error('Netgsm hata kodu:', t) })
      .catch((e) => console.error('SMS hatası:', e.message)),
  ]

  if (lowStockMails.length > 0) {
    const lowStockRows = lowStockMails
      .map((u) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #fce7f3">${u.ad}</td><td style="padding:8px 12px;border-bottom:1px solid #fce7f3;text-align:center;font-weight:bold;color:${u.stok === 0 ? '#ef4444' : '#f97316'}">${u.stok === 0 ? 'STOK TÜKENDİ' : u.stok + ' adet kaldı'}</td></tr>`)
      .join('')
    const lowStockHtml = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:28px 32px;text-align:center">
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff">⚠️ Düşük Stok Uyarısı</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fed7aa">GAMZELİECZANEM</p>
  </div>
  <div style="padding:28px 32px">
    <p style="margin:0 0 16px;color:#44403c;font-size:15px"><strong>${siparisNo}</strong> numaralı sipariş sonrasında aşağıdaki ürünlerin stoğu azaldı:</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#fff7ed"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#9ca3af">Ürün</th><th style="padding:8px 12px;text-align:center;font-size:12px;color:#9ca3af">Durum</th></tr></thead>
      <tbody>${lowStockRows}</tbody>
    </table>
  </div>
</div></body></html>`

    promises.push(
      transporter.sendMail({
        from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
        to: 'durmazatalay6@gmail.com',
        subject: `⚠️ Düşük Stok Uyarısı – ${lowStockMails.length} ürün`,
        html: lowStockHtml,
      }).catch((e) => console.error('Stok e-posta hatası:', e.message))
    )
  }

  await Promise.allSettled(promises)

  return Response.json({ ok: true })
}

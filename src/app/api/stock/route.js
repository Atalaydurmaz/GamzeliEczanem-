import { isAdmin } from '@/lib/adminAuth'
import { getStock, updateStock, getUrunStock } from '@/lib/stock'
import { getNotificationsForUrun, clearNotificationsForUrun } from '@/lib/stockNotifications'
import { adminStokUyariGonder, ESIK } from '@/lib/adminStokUyari'
import { getProductById } from '@/lib/products'
import { sendMail } from '@/lib/notify'

export async function GET() {
  const stock = await getStock()
  return Response.json(stock, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function PATCH(req) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { urunId, stok } = await req.json()
  if (urunId === undefined || stok === undefined) {
    return Response.json({ error: 'Eksik parametre' }, { status: 400 })
  }

  const eskiStok = await getUrunStock(urunId)
  await updateStock(urunId, stok)
  const yeniStok = Math.max(0, stok)

  // Stok eşiğin altına yeni düştüyse admin'e uyarı gönder
  if (eskiStok > ESIK && yeniStok <= ESIK) {
    adminStokUyariGonder([{ id: urunId, stok: yeniStok }]).catch(() => {})
  }

  // Stok sıfırdan fazlaya geçtiyse abonelere bildirim gönder
  if (eskiStok === 0 && yeniStok > 0) {
    const bildirimler = await getNotificationsForUrun(urunId)
    if (bildirimler.length > 0) {
      const urun = await getProductById(urunId)
      const urunAd = urun?.ad ?? `Ürün #${urunId}`
      const urunUrl = `https://gamzelieczanem.com/urunler/${urunId}`

      const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:36px 32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">GAMZELİECZANEM</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">gamzelieczanem.com</p>
  </div>
  <div style="padding:32px">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1c1917">Ürün Tekrar Stokta! 🎉</h1>
    <p style="margin:0 0 24px;color:#78716c;font-size:15px">Stok bildirimi istediğiniz ürün tekrar satışa sunuldu.</p>
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
      <p style="margin:0;font-size:16px;font-weight:700;color:#1c1917">${urunAd}</p>
    </div>
    <div style="text-align:center">
      <a href="${urunUrl}" style="display:inline-block;padding:14px 32px;background:#f43f5e;color:#fff;font-weight:700;font-size:15px;border-radius:999px;text-decoration:none">
        Hemen İncele
      </a>
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:#d1d5db;text-align:center">Stoklar sınırlı olabilir, acele edin!</p>
  </div>
  <div style="background:#fff1f2;padding:20px 32px;text-align:center;border-top:1px solid #fce7f3">
    <a href="mailto:destek.gamzelieczanem@gmail.com" style="color:#f43f5e;font-size:13px;font-weight:600;text-decoration:none">destek.gamzelieczanem@gmail.com</a>
    <p style="margin:8px 0 0;font-size:12px;color:#d1d5db">0262 412 6928 · Gölcük / Kocaeli</p>
  </div>
</div></body></html>`

      await Promise.allSettled(
        bildirimler.map((n) =>
          sendMail({
            to: n.email,
            subject: `${urunAd} tekrar stokta! 🎉`,
            html,
            context: 'stok-bildirim',
          })
        )
      )

      await clearNotificationsForUrun(urunId)
    }
  }

  return Response.json({ urunId, stok: yeniStok })
}

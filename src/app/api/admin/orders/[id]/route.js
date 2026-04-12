import { isAdmin } from '@/lib/adminAuth'

import { updateOrderStatus, getOrderBySiparisNo, deleteOrder, updateKargoTakipNo } from '@/lib/orders'
import { incrementStock } from '@/lib/stock'
import nodemailer from 'nodemailer'


export async function PATCH(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { durum } = await req.json()
  const { id } = await params

  const GECERLI_DURUMLAR = ['Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi', 'İptal Talebi', 'İptal Edildi']
  if (!durum || !GECERLI_DURUMLAR.includes(durum)) {
    return Response.json({ error: 'Geçersiz sipariş durumu.' }, { status: 400 })
  }

  if (durum === 'İptal Edildi') {
    const siparis = await getOrderBySiparisNo(id)
    if (siparis) {
      for (const item of siparis.urunler) {
        await incrementStock(item.id, item.adet)
      }
    }
  }

  const ok = await updateOrderStatus(id, durum)
  return Response.json({ ok })
}

export async function PUT(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { kargoTakipNo } = await req.json()
  const { id } = await params

  const ok = await updateKargoTakipNo(id, kargoTakipNo)
  if (!ok) return Response.json({ error: 'Güncelleme başarısız' }, { status: 500 })

  // Sipariş bilgilerini al ve müşteriye bildir
  const siparis = await getOrderBySiparisNo(id)
  if (siparis) {
    const { adSoyad, email, telefon } = siparis.musteri
    const takipUrl = `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${kargoTakipNo}`

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })

      await Promise.allSettled([
        transporter.sendMail({
          from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Siparişiniz Kargoya Verildi – ${id} 🚚`,
          html: `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:32px;text-align:center">
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff">GAMZELİECZANEM</p>
    <p style="margin:6px 0 0;font-size:13px;color:#fecdd3">gamzelieczanem.com</p>
  </div>
  <div style="padding:32px">
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1c1917">Siparişiniz Yola Çıktı! 🚚</h1>
    <p style="margin:0 0 24px;color:#78716c;font-size:15px">Merhaba <strong>${adSoyad}</strong>, siparişiniz kargoya verildi.</p>
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px 20px;margin-bottom:20px;text-align:center">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Sipariş Numarası</p>
      <p style="margin:0;font-size:20px;font-weight:800;color:#f43f5e;letter-spacing:2px">${id}</p>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Yurtiçi Kargo Takip No</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#1d4ed8;letter-spacing:3px">${kargoTakipNo}</p>
    </div>
    <div style="text-align:center;margin-bottom:24px">
      <a href="${takipUrl}" style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px">Kargomu Takip Et →</a>
    </div>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px 18px">
      <p style="margin:0;color:#065f46;font-size:14px">📦 Yurtiçi Kargo ile gönderildi. Genellikle <strong>1–2 iş günü</strong> içinde teslim edilir.</p>
    </div>
  </div>
  <div style="background:#fff1f2;padding:18px 32px;text-align:center;border-top:1px solid #fce7f3">
    <a href="mailto:destek@gamzelieczanem.com" style="color:#f43f5e;font-size:13px;font-weight:600;text-decoration:none">destek@gamzelieczanem.com</a>
    <p style="margin:6px 0 0;font-size:12px;color:#d1d5db">0262 412 6928 · Gölcük / Kocaeli</p>
  </div>
</div></body></html>`,
        }).catch((e) => console.error('Kargo e-posta hatası:', e.message)),

        fetch(`https://api.netgsm.com.tr/sms/send/get/?usercode=${process.env.NETGSM_USER}&password=${process.env.NETGSM_PASS}&gsmno=${telefon.replace(/\s/g,'').replace(/^\+90/,'90').replace(/^0/,'90')}&message=${encodeURIComponent(`GAMZELİECZANEM: Siparişiniz kargoya verildi! Takip No: ${kargoTakipNo} - Yurtiçi Kargo`)}&msgheader=${encodeURIComponent(process.env.NETGSM_HEADER||'A.DURMAZ')}&filter=0`)
          .catch((e) => console.error('Kargo SMS hatası:', e.message)),
      ])
    } catch (e) {
      console.error('Kargo bildirim hatası:', e.message)
    }
  }

  return Response.json({ ok })
}

export async function DELETE(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { id } = await params
  const ok = await deleteOrder(id)
  return Response.json({ ok })
}

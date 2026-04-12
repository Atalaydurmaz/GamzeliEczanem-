import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { claimPendingOrder } from '@/lib/pendingOrders'
import { createOrderAtomic } from '@/lib/orders'
import { getLowStockUrunler } from '@/lib/stock'
import { incrementUsage } from '@/lib/discountCodes'
import { deleteAbandonedCart } from '@/lib/abandonedCarts'
import { scheduleReminders } from '@/lib/routineReminders'
import { getRafOmruGun } from '@/lib/rafOmru'
import { urunler } from '@/lib/data'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require('iyzipay')

function getIyzipay() {
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox.iyzipay.com',
  })
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// iyzico bu endpoint'e POST ile form data gönderir
export async function POST(req) {
  const formData = await req.formData()
  const paymentId = formData.get('paymentId')
  const conversationData = formData.get('conversationData')
  const conversationId = formData.get('conversationId')
  const mdStatus = formData.get('mdStatus')

  // 3DS doğrulama başarısız (mdStatus 1,2,3,4 başarılı senaryolar)
  if (!['1', '2', '3', '4'].includes(mdStatus)) {
    return NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=3ds`, { status: 302 })
  }

  return new Promise((resolve) => {
    getIyzipay().threedsPayment.create({
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      paymentId,
      conversationData,
    }, async (err, result) => {
      if (err || result.status !== 'success') {
        console.error('iyzico 3DS auth failed:', err || result.errorMessage)
        resolve(NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=odeme`, { status: 302 }))
        return
      }

      // Atomik: al+sil tek işlemde — eş zamanlı iki callback gelirse sadece biri işlenir
      const orderData = await claimPendingOrder(conversationId)
      if (!orderData) {
        resolve(NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=veri`, { status: 302 }))
        return
      }

      const {
        siparisNo, adSoyad, email, telefon,
        adres, sehir, ilce, postaKodu,
        sepet, toplamFiyat, kargoUcreti, genelToplam,
        indirimKodu, indirimTutari,
      } = orderData

      // ── Tutar doğrulama ────────────────────────────────────────────────
      // iyzico'nun onayladığı paidPrice, sunucumuzun hesapladığı genelToplam
      // ile eşleşmeli. Eşleşmiyorsa (fiyat manipülasyonu girişimi veya
      // veri bütünlüğü sorunu) ödemeyi iptal et ve iade yap.
      const beklenenTutar = Math.round(Number(genelToplam) * 100) / 100
      const odenenTutar   = Math.round(parseFloat(result.paidPrice) * 100) / 100
      if (Math.abs(odenenTutar - beklenenTutar) > 0.01) {
        console.error(
          'TUTAR UYUŞMAZLIĞI — fiyat manipülasyonu veya veri hatası! ' +
          `beklenen: ${beklenenTutar} ₺ | iyzico paidPrice: ${odenenTutar} ₺ | ` +
          `conversationId: ${conversationId} | paymentId: ${result.paymentId}`
        )
        await new Promise((cancelResolve) => {
          getIyzipay().cancel.create({
            locale: Iyzipay.LOCALE.TR,
            conversationId,
            paymentId: result.paymentId,
            reason: Iyzipay.REFUND_REASON.OTHER,
            description: 'Tutar uyuşmazlığı nedeniyle otomatik iade',
          }, (cancelErr, cancelResult) => {
            if (cancelErr || cancelResult?.status !== 'success') {
              console.error('iyzico iptal hatası (tutar uyuşmazlığı) — manuel iade gerekebilir:', cancelErr || cancelResult?.errorMessage)
            }
            cancelResolve()
          })
        })
        resolve(NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=tutar`, { status: 302 }))
        return
      }
      // ───────────────────────────────────────────────────────────────────

      const siparisTarihi = new Date().toISOString()

      // ── Atomik transaction: stok düşüm + sipariş kaydı ──────────────
      // PostgreSQL fonksiyonu tek transaction içinde çalışır.
      // Herhangi bir adım başarısız olursa tüm değişiklikler geri alınır.
      // conversationId = idempotencyKey (UUID) ise orders tablosuna da kaydedilir.
      // Böylece aynı key ile tekrar initialize çalışırsa Adım 0'da yakalanır.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const idempotencyKey = UUID_RE.test(conversationId) ? conversationId : null

      const atomicSonuc = await createOrderAtomic({
        siparisNo,
        tarih: siparisTarihi,
        musteri: { adSoyad, email, telefon },
        teslimat: { adres, sehir, ilce, postaKodu },
        urunler: sepet,
        toplamFiyat,
        indirimKodu: indirimKodu || null,
        indirimTutari: indirimTutari || 0,
        kargoUcreti,
        genelToplam,
        odemeYontemi: 'iyzico - Kredi/Banka Kartı',
        durum: 'Hazırlanıyor',
        iyzicoPaymentId: result.paymentId,
        idempotencyKey,
      })

      if (!atomicSonuc.ok) {
        // ── Duplicate sipariş — idempotent yanıt ────────────────────────
        // Aynı siparisNo veya iyzico paymentId daha önce başarıyla işlendi.
        // Stok değişmedi (PostgreSQL rollback). İade gerekmez — başarı sayfasına yönlendir.
        if (atomicSonuc.neden === 'duplicate') {
          console.warn('Duplicate callback — sipariş zaten mevcut, başarı sayfasına yönlendiriliyor | siparis_no:', atomicSonuc.siparisNo)
          resolve(NextResponse.redirect(`${siteUrl}/odeme/basarili?siparis=${atomicSonuc.siparisNo}`, { status: 302 }))
          return
        }

        // ── Gerçek hata — stok/kayıt başarısız, iyzico iade ────────────
        const iptalNeden = atomicSonuc.neden === 'stok'
          ? 'Sipariş sırasında stok tükendi, otomatik iade'
          : 'Sipariş kaydı başarısız, otomatik iade'

        console.error('create_order_atomic başarısız:', atomicSonuc.neden, atomicSonuc.mesaj || atomicSonuc.urunId, '| paymentId:', result.paymentId)

        await new Promise((cancelResolve) => {
          getIyzipay().cancel.create({
            locale: Iyzipay.LOCALE.TR,
            conversationId,
            paymentId: result.paymentId,
            reason: Iyzipay.REFUND_REASON.OTHER,
            description: iptalNeden,
          }, (cancelErr, cancelResult) => {
            if (cancelErr || cancelResult?.status !== 'success') {
              console.error('iyzico iptal hatası — manuel iade gerekebilir:', cancelErr || cancelResult?.errorMessage, '| paymentId:', result.paymentId)
            }
            cancelResolve()
          })
        })

        const yonlenNeden = atomicSonuc.neden === 'stok' ? 'stok' : 'kayit'
        resolve(NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=${yonlenNeden}`, { status: 302 }))
        return
      }
      // ────────────────────────────────────────────────────────────────

      // İndirim kodu kaydı (ödeme + stok + sipariş commit sonrası)
      if (indirimKodu) {
        incrementUsage(indirimKodu, { email, telefon, siparisNo }).then((sonuc) => {
          if (sonuc !== 'ok') {
            console.warn('Kupon kaydı anomalisi — siparis:', siparisNo, '| sonuc:', sonuc)
          }
        }).catch(() => {})
      }
      deleteAbandonedCart(email)

      scheduleReminders(siparisNo, email, adSoyad, sepet, siparisTarihi, (item) => {
        const urunDetay = urunler.find((u) => u.id === item.id)
        return urunDetay ? getRafOmruGun(urunDetay) : 90
      })

      // E-posta ve SMS gönder
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })

        const urunSatirlari = sepet
          .map((item) => `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #fce7f3;font-size:14px;color:#44403c">${item.ad}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #fce7f3;text-align:center;font-size:14px;color:#78716c">${item.adet}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #fce7f3;text-align:right;font-size:14px;font-weight:600;color:#1c1917">${(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺</td>
          </tr>`)
          .join('')

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
        const smsMesaj = `GAMZELİECZANEM: Siparişiniz alindi! No: ${siparisNo}, Tutar: ${genelToplam.toFixed(2)} TL. Teşekkürler!`

        const dusukStoklar = await getLowStockUrunler(5)
        const lowStockMails = dusukStoklar.map(({ id, stok }) => {
          const urun = urunler.find((u) => u.id === id)
          return { ad: urun?.ad ?? `Ürün #${id}`, stok }
        })

        const adminHtml = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#f43f5e,#fb7185);padding:24px 32px;text-align:center">
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff">🛍️ Yeni Sipariş!</p>
    <p style="margin:4px 0 0;font-size:13px;color:#fecdd3">GAMZELİECZANEM Admin Bildirimi</p>
  </div>
  <div style="padding:28px 32px">
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:14px 18px;margin-bottom:20px;text-align:center">
      <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Sipariş No</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#f43f5e;letter-spacing:2px">${siparisNo}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px">
      <tr><td style="padding:6px 0;color:#9ca3af;width:120px">Müşteri</td><td style="padding:6px 0;font-weight:600;color:#1c1917">${adSoyad}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">E-posta</td><td style="padding:6px 0;color:#44403c">${email}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">Telefon</td><td style="padding:6px 0;color:#44403c">${telefon}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">Adres</td><td style="padding:6px 0;color:#44403c">${adres}, ${ilce}/${sehir}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af">Ödeme</td><td style="padding:6px 0;color:#44403c">Kredi/Banka Kartı (iyzico)</td></tr>
    </table>
    <div style="background:#f9fafb;border-radius:10px;padding:14px 18px;margin-bottom:16px">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase">Ürünler</p>
      ${sepet.map((item) => `<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px"><span style="color:#44403c">${item.ad} × ${item.adet}</span><span style="font-weight:600;color:#1c1917">${(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺</span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:1px solid #e5e7eb"><span style="font-weight:700;color:#1c1917">Toplam</span><span style="font-weight:800;color:#f43f5e;font-size:16px">${genelToplam.toLocaleString('tr-TR')} ₺</span></div>
    </div>
    <a href="${siteUrl}/admin" style="display:block;text-align:center;padding:12px 24px;background:#f43f5e;color:#fff;font-weight:700;font-size:14px;border-radius:999px;text-decoration:none">Admin Paneline Git →</a>
  </div>
</div></body></html>`

        const promises = [
          transporter.sendMail({
            from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Siparişiniz Alındı – ${siparisNo} 🎉`,
            html,
          }).catch((e) => console.error('E-posta hatası:', e.message)),
          transporter.sendMail({
            from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
            to: 'durmazatalay6@gmail.com',
            subject: `🛍️ Yeni Sipariş: ${siparisNo} – ${genelToplam.toLocaleString('tr-TR')} ₺`,
            html: adminHtml,
          }).catch((e) => console.error('Admin bildirim hatası:', e.message)),
          fetch(`https://api.netgsm.com.tr/sms/send/get/?usercode=${process.env.NETGSM_USER}&password=${process.env.NETGSM_PASS}&gsmno=${smsGsmno}&message=${encodeURIComponent(smsMesaj)}&msgheader=${encodeURIComponent(process.env.NETGSM_HEADER || 'A.DURMAZ')}&filter=0`)
            .then((r) => r.text()).then((t) => { if (!t.startsWith('00')) console.error('Netgsm hata kodu:', t) })
            .catch((e) => console.error('SMS hatası:', e.message)),
        ]

        if (lowStockMails.length > 0) {
          const lowStockRows = lowStockMails
            .map((u) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #fce7f3">${u.ad}</td><td style="padding:8px 12px;border-bottom:1px solid #fce7f3;text-align:center;font-weight:bold;color:${u.stok === 0 ? '#ef4444' : '#f97316'}">${u.stok === 0 ? 'STOK TÜKENDİ' : u.stok + ' adet kaldı'}</td></tr>`)
            .join('')
          promises.push(
            transporter.sendMail({
              from: `"GAMZELİECZANEM" <${process.env.SMTP_USER}>`,
              to: 'durmazatalay6@gmail.com',
              subject: `⚠️ Düşük Stok Uyarısı – ${lowStockMails.length} ürün`,
              html: `<!DOCTYPE html><html lang="tr"><body style="font-family:Arial,sans-serif;background:#fff7f7"><div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden"><div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:24px;text-align:center"><p style="margin:0;font-size:18px;font-weight:800;color:#fff">⚠️ Düşük Stok Uyarısı</p></div><div style="padding:24px"><p style="color:#44403c">${siparisNo} nolu sipariş sonrası stok azaldı:</p><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fff7ed"><th style="padding:8px 12px;text-align:left;font-size:12px;color:#9ca3af">Ürün</th><th style="padding:8px 12px;text-align:center;font-size:12px;color:#9ca3af">Durum</th></tr></thead><tbody>${lowStockRows}</tbody></table></div></div></body></html>`,
            }).catch((e) => console.error('Stok e-posta hatası:', e.message))
          )
        }

        await Promise.allSettled(promises)
      } catch (e) {
        console.error('Bildirim hatası:', e.message)
      }

      resolve(NextResponse.redirect(`${siteUrl}/odeme/basarili?siparis=${siparisNo}`, { status: 302 }))
    })
  })
}

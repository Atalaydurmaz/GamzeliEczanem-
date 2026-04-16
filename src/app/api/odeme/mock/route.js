import { NextResponse, after } from 'next/server'
import { sendMail, sendSms } from '@/lib/notify'
import { claimPendingOrder } from '@/lib/pendingOrders'
import { createOrderAtomic } from '@/lib/orders'
import { getLowStockUrunler } from '@/lib/stock'
import { incrementUsage } from '@/lib/discountCodes'
import { deleteAbandonedCart } from '@/lib/abandonedCarts'
import { scheduleReminders } from '@/lib/routineReminders'
import { getRafOmruGun } from '@/lib/rafOmru'
import { getProductsByIds } from '@/lib/products'
import {
  musteriSiparisOnayMaili,
  adminYeniSiparisMaili,
  dusukStokUyariMaili,
  siparisOnaySmsMetni,
} from '@/lib/mailTemplates'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(req) {
  const formData = await req.formData()
  const conversationId = formData.get('conversationId')

  if (!conversationId) {
    return NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=veri`, { status: 302 })
  }

  // Atomik: al+sil tek işlemde — double submit koruması
  const orderData = await claimPendingOrder(conversationId)
  if (!orderData) {
    return NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=veri`, { status: 302 })
  }

  const {
    siparisNo, adSoyad, email, telefon,
    adres, sehir, ilce, postaKodu,
    sepet, toplamFiyat, kargoUcreti, genelToplam,
    indirimKodu, indirimTutari,
  } = orderData

  const siparisTarihi = new Date().toISOString()

  // ── Atomik transaction: stok düşüm + sipariş kaydı ──────────────
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
    odemeYontemi: 'Test Ödemesi (Mock)',
    durum: 'Hazırlanıyor',
    iyzicoPaymentId: null,
  })

  if (!atomicSonuc.ok) {
    // Duplicate: sipariş zaten mevcut — başarı sayfasına yönlendir (idempotent)
    if (atomicSonuc.neden === 'duplicate') {
      console.warn('Duplicate mock callback | siparis_no:', atomicSonuc.siparisNo)
      return NextResponse.redirect(`${siteUrl}/odeme/basarili?siparis=${atomicSonuc.siparisNo}`, { status: 302 })
    }
    const yonlenNeden = atomicSonuc.neden === 'stok' ? 'stok' : 'kayit'
    return NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=${yonlenNeden}`, { status: 302 })
  }
  // ────────────────────────────────────────────────────────────────

  after(async () => {
    if (indirimKodu) {
      try { await incrementUsage(indirimKodu) }
      catch (err) { console.warn('[mock] incrementUsage hatası — siparis:', siparisNo, '|', err?.message) }
    }
    try { await deleteAbandonedCart(email) }
    catch (err) { console.warn('[mock] deleteAbandonedCart hatası — email:', email, '|', err?.message) }
    try {
      await scheduleReminders(siparisNo, email, adSoyad, sepet, siparisTarihi,
        (item) => getRafOmruGun(item)
      )
    } catch (err) { console.warn('[mock] scheduleReminders hatası — siparis:', siparisNo, '|', err?.message) }

    try {
      const html = musteriSiparisOnayMaili({
        siparisNo, adSoyad, sepet,
        toplamFiyat, kargoUcreti, genelToplam,
        indirimKodu, indirimTutari,
        adres, sehir, ilce, postaKodu,
      })

      const smsMesaj = siparisOnaySmsMetni({ siparisNo, genelToplam })

      const dusukStoklar = await getLowStockUrunler(5)
      const dusukUrunler = await getProductsByIds(dusukStoklar.map((s) => s.id))
      const dusukUrunMap = Object.fromEntries(dusukUrunler.map((u) => [u.id, u]))
      const lowStockMails = dusukStoklar.map(({ id, stok }) => ({
        ad: dusukUrunMap[id]?.ad ?? `Ürün #${id}`,
        stok,
      }))

      const adminHtml = adminYeniSiparisMaili({
        siparisNo, adSoyad, email, telefon,
        adres, sehir, ilce,
        sepet, genelToplam,
        odemeYontemiHtml: '🧪 Test Ödemesi (Mock)',
        siteUrl,
      })

      const promises = [
        sendMail({ to: email, subject: `Siparişiniz Alındı – ${siparisNo} 🎉`, html, context: 'siparis-onay-mock' }),
        sendMail({ to: 'destek.gamzelieczanem@gmail.com', subject: `🛍️ Yeni Sipariş: ${siparisNo} – ${genelToplam.toLocaleString('tr-TR')} ₺`, html: adminHtml, context: 'admin-yeni-siparis-mock' }),
        sendSms({ telefon, mesaj: smsMesaj, context: 'siparis-onay-mock' }),
      ]

      if (lowStockMails.length > 0) {
        promises.push(
          sendMail({
            to: 'destek.gamzelieczanem@gmail.com',
            subject: `⚠️ Düşük Stok Uyarısı – ${lowStockMails.length} ürün`,
            html: dusukStokUyariMaili({ siparisNo, lowStockItems: lowStockMails }),
            context: 'dusuk-stok-uyari-mock',
          })
        )
      }

      await Promise.allSettled(promises)
    } catch (e) {
      console.error('[mock] Bildirim hatası:', e.message)
    }
  })

  return NextResponse.redirect(`${siteUrl}/odeme/basarili?siparis=${siparisNo}`, { status: 302 })
}

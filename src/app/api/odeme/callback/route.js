import { NextResponse } from 'next/server'
import { sendMail, sendSms } from '@/lib/notify'
import { claimPendingOrder } from '@/lib/pendingOrders'
import { createOrderAtomic, getOrderByPaymentId } from '@/lib/orders'
import { getLowStockUrunler } from '@/lib/stock'
import { incrementUsage } from '@/lib/discountCodes'
import { deleteAbandonedCart } from '@/lib/abandonedCarts'
import { scheduleReminders } from '@/lib/routineReminders'
import { getRafOmruGun } from '@/lib/rafOmru'
import { urunler } from '@/lib/data'
import { withCallbackLock } from '@/lib/callbackLock'
import {
  musteriSiparisOnayMaili,
  adminYeniSiparisMaili,
  dusukStokUyariMaili,
  siparisOnaySmsMetni,
} from '@/lib/mailTemplates'

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

  // ── Katman 1: Instance düzeyinde in-memory lock ────────────────────────────
  // Aynı paymentId ile eş zamanlı gelen iki callback aynı Node.js instance'ına
  // düşerse, withCallbackLock ilkinin sonucunu ikinciye de döner.
  // Farklı instance'lar için Katman 2 (DB atomicity) devreye girer.
  const { sonuc } = await withCallbackLock(paymentId, () => _processCallback({
    paymentId, conversationData, conversationId,
  }))
  return sonuc
}

async function _processCallback({ paymentId, conversationData, conversationId }) {
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

      // ── Katman 2: DB düzeyinde atomik claim ─────────────────────────────
      // DELETE ... RETURNING — PostgreSQL garantisi: eş zamanlı iki istek
      // arasında sadece biri veri alır, diğeri null görür.
      const orderData = await claimPendingOrder(conversationId)

      if (!orderData) {
        // pending_orders'da yok: ya süresi doldu ya da başka bir istek zaten işledi.
        // Sipariş DB'de var mı kontrol et → varsa başarı sayfasına yönlendir.
        const mevcutSiparisNo = await getOrderByPaymentId(paymentId)
        if (mevcutSiparisNo) {
          console.warn(
            'Duplicate iyzico callback — sipariş zaten mevcut, başarı sayfasına yönlendiriliyor | paymentId:', paymentId,
            '| siparis_no:', mevcutSiparisNo
          )
          resolve(NextResponse.redirect(`${siteUrl}/odeme/basarili?siparis=${mevcutSiparisNo}`, { status: 302 }))
        } else {
          // Gerçekten veri yok (token süresi dolmuş olabilir)
          resolve(NextResponse.redirect(`${siteUrl}/odeme/basarisiz?neden=veri`, { status: 302 }))
        }
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
        }).catch((err) => {
          console.warn('[odeme/callback] incrementUsage hatası — siparis:', siparisNo, '|', err?.message)
        })
      }
      deleteAbandonedCart(email)

      scheduleReminders(siparisNo, email, adSoyad, sepet, siparisTarihi, (item) => {
        const urunDetay = urunler.find((u) => u.id === item.id)
        return urunDetay ? getRafOmruGun(urunDetay) : 90
      })

      // E-posta ve SMS gönder
      try {
        const html = musteriSiparisOnayMaili({
          siparisNo, adSoyad, sepet,
          toplamFiyat, kargoUcreti, genelToplam,
          indirimKodu, indirimTutari,
          adres, sehir, ilce, postaKodu,
        })

        const smsMesaj = siparisOnaySmsMetni({ siparisNo, genelToplam })

        const dusukStoklar = await getLowStockUrunler(5)
        const lowStockMails = dusukStoklar.map(({ id, stok }) => {
          const urun = urunler.find((u) => u.id === id)
          return { ad: urun?.ad ?? `Ürün #${id}`, stok }
        })

        const adminHtml = adminYeniSiparisMaili({
          siparisNo, adSoyad, email, telefon,
          adres, sehir, ilce,
          sepet, genelToplam,
          odemeYontemiHtml: 'Kredi/Banka Kartı (iyzico)',
          siteUrl,
        })

        const promises = [
          sendMail({ to: email, subject: `Siparişiniz Alındı – ${siparisNo} 🎉`, html, context: 'siparis-onay' }),
          sendMail({ to: 'destek.gamzelieczanem@gmail.com', subject: `🛍️ Yeni Sipariş: ${siparisNo} – ${genelToplam.toLocaleString('tr-TR')} ₺`, html: adminHtml, context: 'admin-yeni-siparis' }),
          sendSms({ telefon, mesaj: smsMesaj, context: 'siparis-onay' }),
        ]

        if (lowStockMails.length > 0) {
          promises.push(
            sendMail({
              to: 'destek.gamzelieczanem@gmail.com',
              subject: `⚠️ Düşük Stok Uyarısı – ${lowStockMails.length} ürün`,
              html: dusukStokUyariMaili({ siparisNo, lowStockItems: lowStockMails }),
              context: 'dusuk-stok-uyari',
            })
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

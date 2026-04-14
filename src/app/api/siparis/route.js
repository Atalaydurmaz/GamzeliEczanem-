import { sendMail, sendSms } from '@/lib/notify'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { createOrderAtomic } from '@/lib/orders'
import { getUrunStock, getLowStockUrunler } from '@/lib/stock'
import { adminStokUyariGonder, ESIK } from '@/lib/adminStokUyari'
import { incrementUsage } from '@/lib/discountCodes'
import { parseBody, SiparisSchema } from '@/lib/validate'
import { deleteAbandonedCart } from '@/lib/abandonedCarts'
import { scheduleReminders } from '@/lib/routineReminders'
import { getRafOmruGun } from '@/lib/rafOmru'
import { urunler } from '@/lib/data'
import { hesaplaSiparisDetay, sanitizeSiparisAlanlari } from '@/lib/orderUtils'
import {
  musteriSiparisOnayMaili,
  adminYeniSiparisMaili,
  dusukStokUyariMaili,
  siparisOnaySmsMetni,
} from '@/lib/mailTemplates'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(req) {
  // Rate limit: IP başına dakikada 10 sipariş isteği
  const ip = getIp(req)
  const rl = rateLimit(`siparis:${ip}`, 10, 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { hata: 'Çok fazla istek. Lütfen bir dakika bekleyin.' },
      { status: 429 }
    )
  }

  // ── Idempotency-Key header ────────────────────────────────────────────────
  // Client her "sipariş girişimi" için bir UUID üretir ve tüm retry'larda
  // aynı key'i gönderir. Sunucu bu key ile daha önce işlenmiş siparişi
  // döndürür (stok düşümü ve insert tekrar yapılmaz).
  const idempotencyKey = req.headers.get('idempotency-key')
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!idempotencyKey || !UUID_RE.test(idempotencyKey)) {
    return Response.json(
      { hata: 'Geçersiz veya eksik Idempotency-Key başlığı.' },
      { status: 400 }
    )
  }
  // ─────────────────────────────────────────────────────────────────────────

  const parsed = await parseBody(SiparisSchema, req)
  if (!parsed.ok) return parsed.response
  const body = parsed.data
  const { sepet, indirimKodu } = body

  // siparisNo sunucuda üretilir — client'tan gelmez (manipülasyon riski yok)
  const siparisNo = 'SP' + Date.now() + Math.random().toString(36).slice(2, 5).toUpperCase()

  // String alanları sanitize et ve uzunluk sınırlarını uygula
  let temizAlanlar
  try {
    temizAlanlar = sanitizeSiparisAlanlari({
      adSoyad:   body.adSoyad,
      email:     body.email,
      telefon:   body.telefon,
      adres:     body.adres,
      sehir:     body.sehir,
      ilce:      body.ilce,
      postaKodu: body.postaKodu,
    })
  } catch (hata) {
    return Response.json({ hata: String(hata) }, { status: 400 })
  }
  const { adSoyad, email, telefon, adres, sehir, ilce, postaKodu } = temizAlanlar

  // Adet (integer >= 1) ve fiyat doğrulaması — sunucu tarafında hesaplanır
  let siparisFiyatlar
  try {
    siparisFiyatlar = await hesaplaSiparisDetay(sepet, indirimKodu, body.uyeIndirimi, { email, telefon })
  } catch (hata) {
    return Response.json({ hata: String(hata) }, { status: 400 })
  }
  const { sepetSunucu, toplamFiyat, kargoUcreti, indirimTutari, gecerliIndirimKodu, genelToplam } = siparisFiyatlar

  // Stok ön kontrolü — UX için erken hata (non-atomic, sadece bilgilendirici)
  for (const item of sepetSunucu) {
    const mevcutStok = await getUrunStock(item.id)
    if (mevcutStok !== null && mevcutStok < item.adet) {
      return Response.json(
        { hata: `"${item.ad}" için yeterli stok yok. Lütfen sepetinizi güncelleyin.` },
        { status: 409 }
      )
    }
  }

  // ── Atomik transaction: stok düşüm + sipariş kaydı ──────────────
  // createOrderAtomic tek PostgreSQL transaction'ı içinde çalışır.
  // Stok yetersizse veya insert başarısızsa tüm değişiklikler geri alınır.
  const siparisTarihi = new Date().toISOString()
  const atomicSonuc = await createOrderAtomic({
    siparisNo,
    tarih: siparisTarihi,
    musteri: { adSoyad, email, telefon },
    teslimat: { adres, sehir, ilce, postaKodu },
    urunler: sepetSunucu,
    toplamFiyat,
    indirimKodu: gecerliIndirimKodu || null,
    indirimTutari: indirimTutari || 0,
    kargoUcreti,
    genelToplam,
    odemeYontemi: body.odemeTipi === 'havale' ? 'Havale / EFT' : 'Kapıda Ödeme',
    durum: 'Hazırlanıyor',
    iyzicoPaymentId: null,
    idempotencyKey,
  })

  if (!atomicSonuc.ok) {
    // ── Duplicate sipariş — idempotent yanıt ────────────────────────
    // Aynı siparisNo daha önce başarıyla işlendi (ağ retry vb.).
    // Stok değişmedi (PostgreSQL rollback). Mevcut siparişi döndür.
    if (atomicSonuc.neden === 'duplicate') {
      console.warn('Duplicate siparis isteği — idempotent yanıt | siparis_no:', atomicSonuc.siparisNo)
      return Response.json({ ok: true, siparisNo: atomicSonuc.siparisNo, duplicate: true })
    }

    if (atomicSonuc.neden === 'stok') {
      const stokluUrun = sepetSunucu.find((i) => i.id === atomicSonuc.urunId)
      return Response.json(
        { hata: `"${stokluUrun?.ad ?? 'Bir ürün'}" sipariş işlenirken stokta tükendi. Lütfen sepetinizi güncelleyin.` },
        { status: 409 }
      )
    }
    return Response.json({ hata: 'Sipariş kaydedilemedi, lütfen tekrar deneyin.' }, { status: 500 })
  }
  // ────────────────────────────────────────────────────────────────

  // Düşük stok uyarısı — transaction commit'inden sonra kontrol et
  const dusukStokKontrol = []
  for (const item of sepetSunucu) {
    const mevcutStok = await getUrunStock(item.id)
    if (mevcutStok !== null && mevcutStok <= ESIK) {
      dusukStokKontrol.push({ id: item.id, stok: mevcutStok })
    }
  }
  if (dusukStokKontrol.length > 0) {
    adminStokUyariGonder(dusukStokKontrol).catch((err) => {
      console.warn('[siparis] adminStokUyariGonder hatası:', err?.message)
    })
  }

  // İndirim kodu kullanım kaydı (commit sonrası — stok+sipariş güvende)
  if (gecerliIndirimKodu) {
    incrementUsage(gecerliIndirimKodu, { email, telefon, siparisNo }).then((sonuc) => {
      if (sonuc !== 'ok') console.warn('Kupon kaydı anomalisi — siparis:', siparisNo, '| sonuc:', sonuc)
    }).catch((err) => {
      console.warn('[siparis] incrementUsage hatası — siparis:', siparisNo, '|', err?.message)
    })
  }

  deleteAbandonedCart(email)

  scheduleReminders(siparisNo, email, adSoyad, sepetSunucu, siparisTarihi, (item) => {
    const urunDetay = urunler.find((u) => u.id === item.id)
    return urunDetay ? getRafOmruGun(urunDetay) : 90
  })

  // E-posta ve SMS paralel gönder
  const html = musteriSiparisOnayMaili({
    siparisNo, adSoyad, sepet: sepetSunucu,
    toplamFiyat, kargoUcreti, genelToplam,
    indirimKodu: gecerliIndirimKodu, indirimTutari,
    adres, sehir, ilce, postaKodu,
  })

  const smsMesaj = siparisOnaySmsMetni({ siparisNo, genelToplam })

  // Düşük stok kontrolü
  const dusukStoklar = await getLowStockUrunler(5)
  const lowStockMails = dusukStoklar.map(({ id, stok }) => {
    const urun = urunler.find((u) => u.id === id)
    return { ad: urun?.ad ?? `Ürün #${id}`, stok }
  })

  const adminHtml = adminYeniSiparisMaili({
    siparisNo, adSoyad, email, telefon,
    adres, sehir, ilce,
    sepet: sepetSunucu, genelToplam,
    odemeYontemiHtml: 'Kapıda / Havale',
    siteUrl: SITE_URL,
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

  // siparisNo döndür — client, sunucuda üretilen no'yu başarı sayfasına iletir
  return Response.json({ ok: true, siparisNo })
}

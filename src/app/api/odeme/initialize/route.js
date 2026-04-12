import { NextResponse } from 'next/server'
import { setPendingOrder, getPendingOrder } from '@/lib/pendingOrders'
import { getEfektifStok } from '@/lib/stock'
import { hesaplaSiparisDetay, sanitizeSiparisAlanlari } from '@/lib/orderUtils'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { getOrderByIdempotencyKey } from '@/lib/orders'
import { toTurkishUpperCase } from '@/lib/tr-iller'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Iyzipay = require('iyzipay')

function getIyzipay() {
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox.iyzipay.com',
  })
}

export async function POST(req) {
  // Rate limit: IP başına 5 dakikada 10 ödeme başlatma isteği
  const clientIp = getIp(req)
  const rl = rateLimit(`odeme-init:${clientIp}`, 10, 5 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { hata: 'Çok fazla ödeme denemesi. Lütfen birkaç dakika bekleyin.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { kart, sepet, indirimKodu, idempotencyKey } = body
  const gecerliKey = idempotencyKey && UUID_RE.test(idempotencyKey) ? idempotencyKey : null

  // ── Adım 0: Sipariş zaten tamamlandı mı? ─────────────────────────────
  // Aynı idempotencyKey ile daha önce başarılı ödeme yapıldıysa
  // iyzico'ya hiç gitmeden başarı sayfasına yönlendir.
  if (gecerliKey) {
    const mevcutSiparisNo = await getOrderByIdempotencyKey(gecerliKey)
    if (mevcutSiparisNo) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      return NextResponse.json({ redirect: `${siteUrl}/odeme/basarili?siparis=${mevcutSiparisNo}` })
    }
  }

  // ── Adım 1: Initialize zaten yapıldı mı? ─────────────────────────────
  // Aynı idempotencyKey ile iyzico initialize çağrısı yapıldıysa
  // (ağ hatası sonrası retry gibi) kayıtlı HTML'i geri döndür.
  if (gecerliKey) {
    const mevcutPending = await getPendingOrder(gecerliKey)
    if (mevcutPending?.htmlContent) {
      return NextResponse.json({ htmlContent: mevcutPending.htmlContent })
    }
  }

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
    return NextResponse.json({ hata: String(hata) }, { status: 400 })
  }
  const { adSoyad, email, telefon, adres, sehir, ilce, postaKodu } = temizAlanlar

  // Adet (integer >= 1) ve fiyat doğrulaması — sunucu tarafında hesaplanır
  let siparisFiyatlar
  try {
    siparisFiyatlar = await hesaplaSiparisDetay(sepet, indirimKodu, body.uyeIndirimi, { email, telefon })
  } catch (hata) {
    return NextResponse.json({ hata: String(hata) }, { status: 400 })
  }
  const { sepetSunucu, toplamFiyat, kargoUcreti, uyeIndirimi, indirimTutari, gecerliIndirimKodu, genelToplam } = siparisFiyatlar

  // Stok ön kontrolü — kart formuna geçmeden önce hızlı fail.
  // getEfektifStok: normal ürünlerde doğrudan stok, set/bundle ürünlerde
  // alt ürünlerden en kısıtlayıcısını döndürür (migration 013).
  for (const item of sepetSunucu) {
    const mevcutStok = await getEfektifStok(item.id)
    if (mevcutStok < item.adet) {
      return NextResponse.json(
        { hata: `"${item.ad}" için yeterli stok yok. Lütfen sepetinizi güncelleyin.` },
        { status: 409 }
      )
    }
  }

  // conversationId = idempotencyKey (UUID) → iyzico da kendi tarafında mükerrer işlemi engeller.
  // Key gelmemişse fallback olarak timestamp bazlı üret.
  const conversationId = gecerliKey ?? ('GM' + Date.now())
  const siparisNo = 'GM' + Date.now().toString().slice(-8)

  const [ad, ...soyadArr] = adSoyad.trim().split(' ')
  const soyad = soyadArr.join(' ') || ad

  const [sonAy, sonYilKisa] = kart.son.split('/')
  const sonYil = '20' + sonYilKisa

  const gsmNo = '+90' + telefon.replace(/\s/g, '').replace(/^\+90/, '').replace(/^0/, '')

  // Gerçek IP adresi
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

  // iyzico kuralı: sum(basketItems[].price) == price (kuruş hatasız eşitlik)
  // price'ı toplamFiyat'tan değil basket item toplamından hesapla
  const basketItems = sepetSunucu.map((item) => ({
    id: String(item.id),
    name: item.ad,
    category1: 'Kozmetik',
    itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
    price: (item.fiyat * item.adet).toFixed(2),
  }))

  // Basket item toplamını taban al — bu iyzico'nun doğrulayacağı price değeri
  const basketItemsTotal = basketItems.reduce(
    (acc, item) => Math.round((acc + parseFloat(item.price)) * 100) / 100,
    0
  )
  const price = basketItemsTotal.toFixed(2)

  // paidPrice = ürün toplamı + kargo − indirimler (kargo dahil, kuruşu kuruşuna)
  const paidPrice = Math.round(
    (basketItemsTotal + kargoUcreti - uyeIndirimi - indirimTutari) * 100
  ) / 100

  const request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId,
    price,
    paidPrice: paidPrice.toFixed(2),
    currency: Iyzipay.CURRENCY.TRY,
    installment: '1',
    basketId: siparisNo,
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/odeme/callback`,
    paymentCard: {
      cardHolderName: kart.isim,
      cardNumber: kart.numara.replace(/\s/g, ''),
      expireMonth: sonAy,
      expireYear: sonYil,
      cvc: kart.cvv,
      registerCard: '0',
    },
    buyer: {
      id: email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 50),
      name: ad,
      surname: soyad,
      gsmNumber: gsmNo,
      email,
      identityNumber: '11111111111',
      lastLoginDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      registrationDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      registrationAddress: adres,
      ip,
      // iyzico buyer.city büyük harf bekler; Türkçe İ/ı dönüşümü için toTurkishUpperCase kullanılır
      // (örn. "İstanbul" → "İSTANBUL", "Ankara" → "ANKARA")
      city: toTurkishUpperCase(sehir),
      country: 'Turkey',
      zipCode: postaKodu,
    },
    shippingAddress: {
      contactName: adSoyad,
      // Kargo firmaları (Aras, Yurtiçi vb.) büyük harf şehir adı bekler
      city: toTurkishUpperCase(sehir),
      country: 'Turkey',
      address: adres,
      zipCode: postaKodu,
    },
    billingAddress: {
      contactName: adSoyad,
      city: toTurkishUpperCase(sehir),
      country: 'Turkey',
      address: adres,
      zipCode: postaKodu,
    },
    basketItems,
  }

  // API key yoksa mock mod — tüm akışı gerçek gibi test eder
  if (!process.env.IYZICO_API_KEY) {
    const mockHtmlRaw = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff7f7;font-family:Arial,sans-serif}
      .box{background:#fff;border-radius:20px;padding:40px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.1);max-width:400px;width:90%}
      h2{color:#f43f5e;margin:0 0 8px}p{color:#78716c;margin:0 0 24px;font-size:14px}
      button{background:#f43f5e;color:#fff;border:none;border-radius:12px;padding:14px 32px;font-size:16px;font-weight:700;cursor:pointer;width:100%}
      button:hover{background:#e11d48}.badge{background:#ecfdf5;color:#065f46;border-radius:8px;padding:8px 16px;font-size:13px;margin-bottom:20px;display:inline-block}
    </style></head><body>
    <div class="box">
      <h2>🧪 Test Ödemesi</h2>
      <p>iyzico API key ayarlanmamış.<br>Bu mod tüm sipariş akışını gerçek gibi çalıştırır.</p>
      <div class="badge">💳 Kart: 5528 7900 0000 0008</div><br>
      <form method="POST" action="/api/odeme/mock">
        <input type="hidden" name="conversationId" value="${conversationId}">
        <button type="submit">✅ Ödemeyi Onayla (Test)</button>
      </form>
    </div></body></html>`
    const mockHtmlContent = Buffer.from(mockHtmlRaw).toString('base64')
    await setPendingOrder(conversationId, {
      siparisNo,
      adSoyad, email, telefon,
      adres, sehir, ilce, postaKodu,
      sepet: sepetSunucu, toplamFiyat, kargoUcreti, genelToplam,
      indirimKodu: gecerliIndirimKodu || null,
      indirimTutari: indirimTutari || 0,
      htmlContent: mockHtmlContent,
    })
    return NextResponse.json({ htmlContent: mockHtmlContent })
  }

  return new Promise((resolve) => {
    getIyzipay().threedsInitialize.create(request, async (err, result) => {
      if (err) {
        console.error('iyzico initialize error:', err)
        resolve(NextResponse.json({ hata: 'Ödeme servisi hatası, lütfen tekrar deneyin.' }, { status: 500 }))
        return
      }
      if (result.status !== 'success') {
        console.error('iyzico initialize failed:', result.errorMessage, result.errorCode)
        resolve(NextResponse.json({ hata: result.errorMessage || 'Ödeme başlatılamadı.' }, { status: 400 }))
        return
      }

      // sepetSunucu kullan — client'dan gelen ham sepet değil, sunucuda
      // doğrulanmış fiyatlar (item.fiyat = urunler dizisindeki gerçek fiyat)
      // htmlContent retry için de saklanır: aynı idempotencyKey ile tekrar
      // istek gelirse iyzico'ya gitmeden aynı 3DS formu döndürülür.
      await setPendingOrder(conversationId, {
        siparisNo,
        adSoyad, email, telefon,
        adres, sehir, ilce, postaKodu,
        sepet: sepetSunucu,
        toplamFiyat, kargoUcreti, genelToplam,
        indirimKodu: gecerliIndirimKodu || null,
        indirimTutari: indirimTutari || 0,
        htmlContent: result.threeDSHtmlContent,
      })

      resolve(NextResponse.json({ htmlContent: result.threeDSHtmlContent }))
    })
  })
}

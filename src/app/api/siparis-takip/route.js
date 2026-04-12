import { getOrderBySiparisNo } from '@/lib/orders'
import { getCurrentUserEmail } from '@/lib/userAuth'
import { rateLimit, getIp } from '@/lib/rateLimit'

// Sipariş durumunu sayısal adıma çevirir (takip timeline için)
function durumToAdim(durum) {
  switch (durum) {
    case 'Teslim Edildi':  return 4
    case 'Kargoya Verildi': return 3
    case 'Hazırlanıyor':   return 2
    default:               return 1
  }
}

// GET kaldırıldı — email query param'da açık metin olarak gönderilmesin.
// POST kullan: body { siparisNo, email } (email opsiyonel, giriş yapılmışsa session'dan alınır).

export async function POST(request) {
  // Rate limit: IP başına dakikada 10 sorgu
  const ip = getIp(request)
  const rl = rateLimit(`takip:${ip}`, 10, 60_000)
  if (!rl.ok) {
    return Response.json({ hata: 'Çok fazla istek. Lütfen bir dakika bekleyin.' }, { status: 429 })
  }

  let body = {}
  try { body = await request.json() } catch {}

  const siparisNo = typeof body.siparisNo === 'string' ? body.siparisNo.trim().toUpperCase() : ''
  const bodyEmail = typeof body.email  === 'string' ? body.email.trim().toLowerCase()   : ''

  if (!siparisNo) {
    return Response.json({ hata: 'Sipariş numarası gereklidir.' }, { status: 400 })
  }

  // ── Sahiplik doğrulaması ─────────────────────────────────────────────────
  // Önce session'dan email al (giriş yapmış kullanıcı).
  // Giriş yapılmamışsa body'deki email kullanılır (misafir takibi).
  const sessionEmail = await getCurrentUserEmail()
  const dogrulamaEmail = sessionEmail ?? bodyEmail

  if (!dogrulamaEmail) {
    // Giriş yapılmamış ve email girilmemiş
    return Response.json(
      { hata: 'Sipariş takibi için e-posta adresinizi girin.', emailGerekli: true },
      { status: 400 }
    )
  }
  // ────────────────────────────────────────────────────────────────────────

  const siparis = await getOrderBySiparisNo(siparisNo)

  // "Bulunamadı" ile "e-posta yanlış" aynı hata mesajını döner.
  // Enumeration saldırısı: sipariş var mı bilgisi sızdırılmaz.
  if (
    !siparis ||
    siparis.musteri?.email?.toLowerCase() !== dogrulamaEmail.toLowerCase()
  ) {
    return Response.json(
      { hata: 'Sipariş bulunamadı. Numara veya e-posta hatalı.' },
      { status: 404 }
    )
  }

  const tarihStr = new Date(siparis.tarih).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Yanıtta PII (email, telefon, tam adres) döndürülmez
  return Response.json({
    no:          siparis.siparisNo,
    tarih:       tarihStr,
    durum:       durumToAdim(siparis.durum),
    durumMetin:  siparis.durum,
    kargo:       siparis.teslimat?.kargoFirmasi || null,
    kargoNo:     siparis.kargoTakipNo || null,
    urunler:     (siparis.urunler || []).map((u) => ({
      ad:    u.ad || u.name,
      adet:  u.adet || u.quantity || 1,
      fiyat: u.fiyat || u.price || 0,
    })),
    genelToplam: siparis.genelToplam,
  })
}

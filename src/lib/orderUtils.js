import { urunler } from './data'
import { validateDiscountCode } from './discountCodes'

const KARGO_UCRETI = 130
const KARGO_LIMIT = 1500
const MAX_UYE_INDIRIMI_ORANI = 0.05

// Sipariş string alanları için maksimum uzunluklar
const ALAN_LIMITLERI = {
  adSoyad:   100,
  email:     200,
  telefon:    20,
  adres:     500,
  sehir:     100,
  ilce:      100,
  postaKodu:  10,
}

/**
 * String alanı sanitize eder:
 * - Kontrol karakterlerini (null byte, çift boşluk vb.) temizler
 * - Belirtilen maksimum uzunluğa truncate eder
 */
function sanitizeStr(value, maxLen) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // kontrol karakterleri
    .trim()
    .slice(0, maxLen)
}

/**
 * Sipariş adres/müşteri alanlarını doğrular ve sanitize eder.
 * @throws {string} Zorunlu alan eksikse veya çok uzunsa
 */
export function sanitizeSiparisAlanlari({ adSoyad, email, telefon, adres, sehir, ilce, postaKodu }) {
  const temiz = {
    adSoyad:   sanitizeStr(adSoyad,   ALAN_LIMITLERI.adSoyad),
    email:     sanitizeStr(email,     ALAN_LIMITLERI.email),
    telefon:   sanitizeStr(telefon,   ALAN_LIMITLERI.telefon),
    adres:     sanitizeStr(adres,     ALAN_LIMITLERI.adres),
    sehir:     sanitizeStr(sehir,     ALAN_LIMITLERI.sehir),
    ilce:      sanitizeStr(ilce,      ALAN_LIMITLERI.ilce),
    postaKodu: sanitizeStr(postaKodu, ALAN_LIMITLERI.postaKodu),
  }

  if (!temiz.adSoyad) throw 'Ad soyad boş olamaz'
  if (!temiz.email || !temiz.email.includes('@')) throw 'Geçerli bir e-posta giriniz'
  if (!temiz.adres) throw 'Adres boş olamaz'

  return temiz
}

/**
 * Sepet kalemlerini sunucu tarafında doğrular ve tüm tutarları yeniden hesaplar.
 *
 * - item.adet: tam sayı ve >= 1 olmalı (aksi halde hata fırlatır)
 * - item.fiyat: frontend değeri görmezden gelinir; urunler dizisindeki gerçek fiyat kullanılır
 * - indirimKodu: veritabanından yeniden doğrulanır
 * - uyeIndirimiFrontend: frontend'den gelen değer, maksimum %5 ile sınırlandırılır
 *   (üyelik server-side doğrulanamadığı için manipülasyona karşı cap uygulanır)
 *
 * @returns {{ sepetSunucu, toplamFiyat, kargoUcreti, indirimTutari, gecerliIndirimKodu, uyeIndirimi, genelToplam }}
 * @throws {string} Geçersiz adet veya bilinmeyen ürün durumunda
 */
export async function hesaplaSiparisDetay(sepet, indirimKodu, uyeIndirimiFrontend = 0, { email, telefon } = {}) {
  if (!Array.isArray(sepet) || sepet.length === 0) {
    throw 'Sepet boş veya geçersiz'
  }

  const sepetSunucu = []
  for (const item of sepet) {
    const adet = Math.floor(Number(item.adet))
    if (!Number.isFinite(adet) || adet < 1) {
      throw `Geçersiz ürün adedi: ${item.id}`
    }
    const urun = urunler.find((u) => u.id === item.id || u.id === Number(item.id))
    if (!urun) {
      throw `Ürün bulunamadı: ${item.id}`
    }
    sepetSunucu.push({ ...item, id: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet })
  }

  const toplamFiyat =
    Math.round(sepetSunucu.reduce((acc, i) => acc + i.fiyat * i.adet, 0) * 100) / 100

  const kargoUcreti = toplamFiyat >= KARGO_LIMIT ? 0 : KARGO_UCRETI

  // Üye indirimi: frontend değerini kabul et ama maksimum %5 ile sınırlandır
  const maxUyeIndirimi = Math.round(toplamFiyat * MAX_UYE_INDIRIMI_ORANI)
  const uyeIndirimi = Math.min(Math.max(0, Math.floor(Number(uyeIndirimiFrontend) || 0)), maxUyeIndirimi)

  let indirimTutari = 0
  let gecerliIndirimKodu = null
  if (indirimKodu) {
    const sonuc = await validateDiscountCode(indirimKodu, toplamFiyat, { email, telefon })
    if (sonuc.gecerli) {
      indirimTutari = sonuc.indirimTutari
      gecerliIndirimKodu = sonuc.kod
    }
    // Geçersiz/süresi dolmuş kod gelirse indirim 0 olur, sipariş bloklanmaz
  }

  const genelToplam =
    Math.round((toplamFiyat - uyeIndirimi - indirimTutari + kargoUcreti) * 100) / 100

  return {
    sepetSunucu,
    toplamFiyat,
    kargoUcreti,
    uyeIndirimi,
    indirimTutari,
    gecerliIndirimKodu,
    genelToplam,
  }
}

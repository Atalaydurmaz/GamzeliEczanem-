import 'server-only'

/**
 * Yurtiçi Kargo servis katmanı.
 *
 * İki mod destekler:
 *  - mock: Geliştirme için fake gönderi kodu üretir (YURTICI_MODE=mock)
 *  - real: Gerçek SOAP endpoint'ine gider (YURTICI_MODE=real + credentials)
 *
 * Yurtiçi'nin "ShippingOrderInt" WSDL'si üzerinden `createShipment` çağrısı yapar.
 * Dokümantasyon kurumsal sözleşme sonrası Yurtiçi tarafından sağlanır.
 */

const MOD = (process.env.YURTICI_MODE || 'mock').toLowerCase()
const USERNAME = process.env.YURTICI_WS_USERNAME || ''
const PASSWORD = process.env.YURTICI_WS_PASSWORD || ''
const CUSTOMER_ID = process.env.YURTICI_WS_CUSTOMER_ID || ''
const WS_URL = process.env.YURTICI_WS_URL || 'https://testwebservices.yurticikargo.com/KOPSWebServices/ShippingOrderInt.asmx'

/**
 * XML için özel karakterleri escape et.
 */
function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * SOAP response içinden tag değerini çeker (namespace-agnostic).
 */
function extractTag(xml, tag) {
  const re = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : null
}

/**
 * Yurtiçi createShipment çağrısı — gerçek SOAP isteği.
 *
 * ShippingOrderVO alan şeması (Yurtiçi WSDL):
 *  - cargoKey: Bizim uniqeu kargo anahtarımız (sipariş no kullanıyoruz)
 *  - invoiceKey: İkincil unique (fatura referansı)
 *  - receiverCustName, receiverAddress, receiverPhone1
 *  - cityName, townName
 *  - cargoCount: Koli sayısı (varsayılan 1)
 *  - ttInvoiceAmount: Fatura tutarı (kapıda ödeme için, biz 0 geçiyoruz — ön ödemeli)
 *  - specialField1/2/3: Opsiyonel özel alanlar (sipariş notu vs.)
 *
 * Başarı: outResult=0, outJobId dolu
 * Hata:   outResult≠0, outErrorMessage dolu
 */
async function createShipmentReal(siparis) {
  if (!USERNAME || !PASSWORD || !CUSTOMER_ID) {
    throw new Error('Yurtiçi credentials eksik (YURTICI_WS_USERNAME/PASSWORD/CUSTOMER_ID env\'de yok)')
  }

  const vo = {
    cargoKey: siparis.siparisNo,
    invoiceKey: `${siparis.siparisNo}-INV`,
    receiverCustName: siparis.musteri.adSoyad,
    receiverAddress: siparis.teslimat.adres,
    cityName: siparis.teslimat.sehir,
    townName: siparis.teslimat.ilce,
    receiverPhone1: siparis.musteri.telefon,
    cargoCount: 1,
    ttInvoiceAmount: 0, // Ön ödemeli — kapıda tahsilat yok
    specialField1: `Sipariş ${siparis.siparisNo}`,
  }

  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:createShipment>
      <tem:wsUserName>${xmlEscape(USERNAME)}</tem:wsUserName>
      <tem:wsPassword>${xmlEscape(PASSWORD)}</tem:wsPassword>
      <tem:wsLanguage>TR</tem:wsLanguage>
      <tem:ShippingOrderVO>
        <tem:cargoKey>${xmlEscape(vo.cargoKey)}</tem:cargoKey>
        <tem:invoiceKey>${xmlEscape(vo.invoiceKey)}</tem:invoiceKey>
        <tem:receiverCustName>${xmlEscape(vo.receiverCustName)}</tem:receiverCustName>
        <tem:receiverAddress>${xmlEscape(vo.receiverAddress)}</tem:receiverAddress>
        <tem:cityName>${xmlEscape(vo.cityName)}</tem:cityName>
        <tem:townName>${xmlEscape(vo.townName)}</tem:townName>
        <tem:receiverPhone1>${xmlEscape(vo.receiverPhone1)}</tem:receiverPhone1>
        <tem:cargoCount>${vo.cargoCount}</tem:cargoCount>
        <tem:ttInvoiceAmount>${vo.ttInvoiceAmount}</tem:ttInvoiceAmount>
        <tem:specialField1>${xmlEscape(vo.specialField1)}</tem:specialField1>
      </tem:ShippingOrderVO>
      <tem:userLanguage>TR</tem:userLanguage>
    </tem:createShipment>
  </soap:Body>
</soap:Envelope>`

  const res = await fetch(WS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://tempuri.org/createShipment',
    },
    body: envelope,
  })

  const xml = await res.text()
  if (!res.ok) {
    throw new Error(`Yurtiçi SOAP hata (HTTP ${res.status}): ${xml.slice(0, 300)}`)
  }

  const outResult = extractTag(xml, 'outResult')
  const outJobId = extractTag(xml, 'outJobId')
  const outErrorMessage = extractTag(xml, 'outErrorMessage')
  const cargoKey = extractTag(xml, 'cargoKey') || vo.cargoKey

  if (outResult !== '0') {
    throw new Error(`Yurtiçi reddetti: ${outErrorMessage || 'Bilinmeyen hata'} (code=${outResult})`)
  }

  return {
    // cargoKey = bizim siparisNo; takipNo olarak da bu kullanılır
    takipNo: cargoKey,
    jobId: outJobId,
    mod: 'real',
  }
}

/**
 * Mock mode — deterministic fake cargo code. UI'yi test etmek için.
 */
function createShipmentMock(siparis) {
  // Format: YK + siparisNo sondaki 6 hanesi + timestamp suffix
  const suffix = String(Date.now()).slice(-6)
  const takipNo = `YK${siparis.siparisNo.replace(/\D/g, '').slice(-8)}${suffix}`
  return {
    takipNo,
    jobId: `MOCK-${suffix}`,
    mod: 'mock',
  }
}

/**
 * Ana giriş noktası — admin API route'ı bunu çağırır.
 * @param {object} siparis - Supabase'den gelen order row (musteri, teslimat, siparisNo içermeli)
 * @returns {Promise<{takipNo: string, jobId: string, mod: string}>}
 */
export async function createShipment(siparis) {
  // Validasyon — gerekli alanlar yoksa Yurtiçi'ye gitmeden hata
  if (!siparis?.siparisNo) throw new Error('siparisNo eksik')
  if (!siparis.musteri?.adSoyad) throw new Error('Müşteri adı eksik')
  if (!siparis.musteri?.telefon) throw new Error('Müşteri telefonu eksik')
  if (!siparis.teslimat?.adres) throw new Error('Teslimat adresi eksik')
  if (!siparis.teslimat?.sehir || !siparis.teslimat?.ilce) throw new Error('Şehir/ilçe eksik')

  if (MOD === 'real') return createShipmentReal(siparis)
  return createShipmentMock(siparis)
}

export function getMode() {
  return MOD
}

import { supabaseAdmin } from './supabase'

/**
 * Atomik sipariş oluşturma — stok düşüm + orders INSERT tek transaction.
 * Başarıda { ok: true } döner.
 * Stok yetersizse { ok: false, neden: 'stok', urunId: number } döner.
 * Diğer DB hatalarında { ok: false, neden: 'db', mesaj: string } döner.
 */
export async function createOrderAtomic(order) {
  const { error } = await supabaseAdmin.rpc('create_order_atomic', {
    p_siparis_no:        order.siparisNo,
    p_tarih:             order.tarih,
    p_musteri:           order.musteri,
    p_teslimat:          order.teslimat,
    p_urunler:           order.urunler,
    p_toplam_fiyat:      order.toplamFiyat,
    p_indirim_kodu:      order.indirimKodu || null,
    p_indirim_tutari:    order.indirimTutari || 0,
    p_kargo_ucreti:      order.kargoUcreti || 0,
    p_genel_toplam:      order.genelToplam,
    p_odeme_yontemi:     order.odemeYontemi,
    p_durum:             order.durum || 'Hazırlanıyor',
    p_iyzico_payment_id: order.iyzicoPaymentId || null,
    p_idempotency_key:   order.idempotencyKey  || null,
  })

  if (!error) return { ok: true }

  const mesaj = error.message || ''

  // RAISE EXCEPTION 'STOK_YETERSIZ:123'
  const stokMatch = mesaj.match(/STOK_YETERSIZ:(\d+)/)
  if (stokMatch) {
    return { ok: false, neden: 'stok', urunId: Number(stokMatch[1]) }
  }

  // RAISE EXCEPTION 'DUPLICATE_ORDER:<siparis_no>'
  // siparis_no PRIMARY KEY veya iyzico_payment_id UNIQUE ihlali.
  // Stok değişiklikleri PostgreSQL tarafından geri alındı.
  if (mesaj.includes('DUPLICATE_ORDER')) {
    const siparisNo = mesaj.split('DUPLICATE_ORDER:')[1]?.trim() || order.siparisNo
    console.warn('createOrderAtomic duplicate — idempotent yanıt dönülecek | siparis_no:', siparisNo)
    return { ok: false, neden: 'duplicate', siparisNo }
  }

  console.error('createOrderAtomic DB hatası:', mesaj, '| siparis_no:', order.siparisNo)
  return { ok: false, neden: 'db', mesaj }
}

// Supabase satırını uygulama formatına (camelCase) dönüştürür
function mapRow(row) {
  return {
    siparisNo:       row.siparis_no,
    tarih:           row.tarih,
    musteri:         row.musteri,
    teslimat:        row.teslimat,
    urunler:         row.urunler,
    toplamFiyat:     Number(row.toplam_fiyat),
    indirimKodu:     row.indirim_kodu,
    indirimTutari:   Number(row.indirim_tutari),
    kargoUcreti:     Number(row.kargo_ucreti),
    genelToplam:     Number(row.genel_toplam),
    odemeYontemi:    row.odeme_yontemi,
    durum:           row.durum,
    iyzicoPaymentId: row.iyzico_payment_id,
    kargoTakipNo:    row.kargo_takip_no || null,
  }
}

export async function getOrders() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('tarih', { ascending: false })
  return (data || []).map(mapRow)
}

// Başarıda true, hata/duplicate'te false döner
export async function saveOrder(order) {
  const { error } = await supabaseAdmin.from('orders').insert({
    siparis_no:        order.siparisNo,
    tarih:             order.tarih,
    musteri:           order.musteri,
    teslimat:          order.teslimat,
    urunler:           order.urunler,
    toplam_fiyat:      order.toplamFiyat,
    indirim_kodu:      order.indirimKodu || null,
    indirim_tutari:    order.indirimTutari || 0,
    kargo_ucreti:      order.kargoUcreti || 0,
    genel_toplam:      order.genelToplam,
    odeme_yontemi:     order.odemeYontemi,
    durum:             order.durum || 'Hazırlanıyor',
    iyzico_payment_id: order.iyzicoPaymentId || null,
  })
  if (error) {
    console.error('saveOrder DB hatası:', error.message, '| siparis_no:', order.siparisNo)
    return false
  }
  return true
}

/**
 * iyzico paymentId'ye göre sipariş numarası döner.
 * Duplicate callback'lerde "sipariş zaten var mı?" kontrolü için kullanılır.
 */
export async function getOrderByPaymentId(paymentId) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('siparis_no')
    .eq('iyzico_payment_id', paymentId)
    .maybeSingle()
  return data?.siparis_no || null
}

export async function getOrderByIdempotencyKey(idempotencyKey) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('siparis_no')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  return data?.siparis_no || null
}

export async function getOrderBySiparisNo(siparisNo) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('siparis_no', siparisNo)
    .single()
  return data ? mapRow(data) : null
}

/**
 * Siparişi iptal eder ve stokları atomik olarak geri iade eder.
 * Set/bundle ürünlerin alt ürün stokları da doğru şekilde iade edilir.
 *
 * Döndürür:
 *   { ok: true }                          → başarı
 *   { ok: false, neden: 'not_found' }     → sipariş bulunamadı
 *   { ok: false, neden: 'already_cancelled' } → zaten iptal edilmiş
 *   { ok: false, neden: 'db', mesaj }     → beklenmedik DB hatası
 *
 * SQL fonksiyonu hem stok iade + hem durum güncellemeyi tek transaction'da yapar.
 * Migration 015 Supabase SQL Editor'de çalıştırılmış olmalıdır.
 */
export async function cancelOrderAtomic(siparisNo) {
  const { data, error } = await supabaseAdmin.rpc('cancel_order_atomic', {
    p_siparis_no: siparisNo,
  })

  if (error) {
    // Migration henüz çalıştırılmadıysa (RPC yok) fallback: basit durum güncelle
    console.warn('cancel_order_atomic RPC hatası (migration 015 eksik olabilir):', error.message)
    return { ok: false, neden: 'db', mesaj: error.message }
  }

  if (data === 'not_found')        return { ok: false, neden: 'not_found' }
  if (data === 'already_cancelled') return { ok: false, neden: 'already_cancelled' }

  return { ok: true } // 'ok'
}

export async function updateOrderStatus(siparisNo, durum) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ durum })
    .eq('siparis_no', siparisNo)
  return !error
}

export async function updateKargoTakipNo(siparisNo, kargoTakipNo) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ kargo_takip_no: kargoTakipNo, durum: 'Kargoya Verildi' })
    .eq('siparis_no', siparisNo)
  return !error
}

export async function deleteOrder(siparisNo) {
  const { error } = await supabaseAdmin
    .from('orders')
    .delete()
    .eq('siparis_no', siparisNo)
  return !error
}

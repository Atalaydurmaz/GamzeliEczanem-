import { supabaseAdmin } from './supabase'

export async function getStock() {
  const { data } = await supabaseAdmin.from('stock').select('urun_id, stok')
  return Object.fromEntries((data || []).map(r => [String(r.urun_id), r.stok]))
}

export async function getUrunStock(urunId) {
  const { data } = await supabaseAdmin
    .from('stock')
    .select('stok')
    .eq('urun_id', Number(urunId))
    .single()
  return data?.stok ?? 0
}

/**
 * Set/bundle ürün dahil stok kontrolü.
 * - Normal ürün → doğrudan stock tablosuna bakar
 * - Set ürünü    → get_bundle_available_stock() RPC çağırır;
 *                  alt ürünlerden en kısıtlayıcısını döndürür
 * Döndürdüğü değer: kaç adet satılabilir (integer)
 */
export async function getEfektifStok(urunId) {
  const { data, error } = await supabaseAdmin
    .rpc('get_bundle_available_stock', { p_urun_id: Number(urunId) })
  if (error) {
    // Fonksiyon henüz oluşturulmadıysa (migration 013 çalışmadı) normal stoğa dön
    console.warn('get_bundle_available_stock RPC bulunamadı, fallback:', error.message)
    return getUrunStock(urunId)
  }
  return data ?? 0
}

export async function updateStock(urunId, yeniStok) {
  await supabaseAdmin
    .from('stock')
    .upsert({ urun_id: Number(urunId), stok: Math.max(0, yeniStok) }, { onConflict: 'urun_id' })
}

// Atomik stok düşümü — race condition korumalı.
// Supabase'de 005_atomic_stock.sql migration'ı çalıştırılmış olmalı.
// Başarılıysa yeni stok değerini, yetersizse -1 döner.
export async function decrementStock(urunId, miktar = 1) {
  const { data, error } = await supabaseAdmin
    .rpc('decrement_stock_safe', { p_urun_id: Number(urunId), p_miktar: miktar })
  if (error) {
    // RPC yoksa (migration henüz çalışmadıysa) eski yönteme düş
    console.warn('decrement_stock_safe RPC bulunamadı, fallback:', error.message)
    const mevcutStok = await getUrunStock(urunId)
    await updateStock(urunId, mevcutStok - miktar)
    return mevcutStok - miktar
  }
  return data // -1 ise stok yetersiz demek
}

export async function incrementStock(urunId, miktar = 1) {
  const mevcutStok = await getUrunStock(urunId)
  await updateStock(urunId, mevcutStok + miktar)
}

export async function getLowStockUrunler(esik = 5) {
  const { data } = await supabaseAdmin
    .from('stock')
    .select('urun_id, stok')
    .lte('stok', esik)
  return (data || []).map(r => ({ id: r.urun_id, stok: r.stok }))
}

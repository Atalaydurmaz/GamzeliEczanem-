import { supabaseAdmin } from '@/lib/supabase'

function mapRow(row, stockMap = {}) {
  return {
    id: row.id,
    ad: row.ad,
    kategori: row.kategori,
    altKategori: row.alt_kategori ?? null,
    fiyat: Number(row.fiyat),
    eskiFiyat: row.eski_fiyat != null ? Number(row.eski_fiyat) : null,
    aciklama: row.aciklama ?? null,
    detay: row.detay ?? null,
    ciltTipi: row.cilt_tipi ?? null,
    kullanim: row.kullanim ?? null,
    rutinOnerisi: row.rutin_onerisi ?? null,
    icerik: row.icerik ?? null,
    skt: row.skt ?? null,
    gorsel: row.gorsel ?? null,
    puan: Number(row.puan ?? 0),
    yorumSayisi: row.yorum_sayisi ?? 0,
    etiket: row.etiket ?? null,
    aktif: row.aktif !== false,
    stok: stockMap[row.id] ?? 0,
  }
}

export async function getProducts({ kategori, aktif = true } = {}) {
  let q = supabaseAdmin.from('products').select('*')
  if (aktif !== null) q = q.eq('aktif', aktif)
  if (kategori) q = q.eq('kategori', kategori)
  q = q.order('id', { ascending: true })
  const { data: products, error } = await q
  if (error) throw error
  if (!products?.length) return []
  const ids = products.map(p => p.id)
  const { data: stocks } = await supabaseAdmin.from('stock').select('urun_id, stok').in('urun_id', ids)
  const stockMap = {}
  for (const s of stocks ?? []) stockMap[s.urun_id] = s.stok
  return products.map(row => mapRow(row, stockMap))
}

export async function getProductsByIds(ids) {
  if (!ids?.length) return []
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .in('id', ids.map(Number))
  if (error) return []
  return (data || []).map(row => mapRow(row))
}

export async function getProductById(id) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', Number(id))
    .single()
  if (error) return null
  const { data: stockRow } = await supabaseAdmin
    .from('stock')
    .select('stok')
    .eq('urun_id', Number(id))
    .single()
  return mapRow(data, { [data.id]: stockRow?.stok ?? 0 })
}

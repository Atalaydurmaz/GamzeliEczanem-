import { supabaseAdmin } from './supabase'

export async function getReviews() {
  const { data } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .order('tarih', { ascending: false })
  return data || []
}

export async function getReviewsByProduct(urunId) {
  const { data } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('urun_id', Number(urunId))
    .order('tarih', { ascending: false })
  return data || []
}

export async function addReview(review) {
  await supabaseAdmin.from('reviews').insert({
    urun_id:       review.urunId,
    kullanici_adi: review.kullaniciAd,
    puan:          review.puan,
    yorum:         review.yorum,
    tarih:         review.tarih || new Date().toISOString(),
    ...(Array.isArray(review.fotolar) && review.fotolar.length > 0 && { fotolar: review.fotolar }),
  })
}

export async function getReviewById(id) {
  const { data } = await supabaseAdmin.from('reviews').select('*').eq('id', Number(id)).single()
  return data || null
}

export async function deleteReview(id) {
  const { error } = await supabaseAdmin.from('reviews').delete().eq('id', Number(id))
  return !error
}

export async function getStats() {
  const { data } = await supabaseAdmin
    .from('reviews')
    .select('urun_id, puan')
  const stats = {}
  for (const r of (data || [])) {
    if (!stats[r.urun_id]) stats[r.urun_id] = { toplam: 0, sayi: 0 }
    stats[r.urun_id].toplam += r.puan
    stats[r.urun_id].sayi += 1
  }
  const result = {}
  for (const [id, s] of Object.entries(stats)) {
    result[id] = { puan: Math.round((s.toplam / s.sayi) * 10) / 10, yorumSayisi: s.sayi }
  }
  return result
}

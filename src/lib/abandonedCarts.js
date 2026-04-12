import { supabaseAdmin } from './supabase'

export async function upsertAbandonedCart(email, sepet, toplamFiyat) {
  const now = new Date().toISOString()
  await supabaseAdmin
    .from('abandoned_carts')
    .upsert(
      { email: email.toLowerCase(), sepet, toplam_fiyat: toplamFiyat, guncelleme: now, email_gonderildi: false },
      { onConflict: 'email' }
    )
}

export async function getAbandonedCarts(dakika = 60) {
  const sinir = new Date(Date.now() - dakika * 60 * 1000).toISOString()
  const { data } = await supabaseAdmin
    .from('abandoned_carts')
    .select('*')
    .eq('email_gonderildi', false)
    .lt('guncelleme', sinir)
    .not('sepet', 'eq', '[]')
  return data || []
}

export async function markEmailSent(email) {
  await supabaseAdmin
    .from('abandoned_carts')
    .update({ email_gonderildi: true })
    .eq('email', email.toLowerCase())
}

export async function deleteAbandonedCart(email) {
  await supabaseAdmin
    .from('abandoned_carts')
    .delete()
    .eq('email', email.toLowerCase())
}

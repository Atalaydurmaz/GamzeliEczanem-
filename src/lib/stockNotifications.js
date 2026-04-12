import { supabaseAdmin } from './supabase'

export async function addNotification(urunId, email) {
  const { error } = await supabaseAdmin
    .from('stock_notifications')
    .insert({ urun_id: urunId, email: email.toLowerCase() })
  // UNIQUE constraint ihlali = zaten kayıtlı
  if (error?.code === '23505') return false
  return !error
}

export async function getNotificationsForUrun(urunId) {
  const { data } = await supabaseAdmin
    .from('stock_notifications')
    .select('email')
    .eq('urun_id', urunId)
  return data || []
}

export async function clearNotificationsForUrun(urunId) {
  await supabaseAdmin
    .from('stock_notifications')
    .delete()
    .eq('urun_id', urunId)
}

import { supabaseAdmin } from './supabase'

export async function setPendingOrder(conversationId, orderData) {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  await supabaseAdmin
    .from('pending_orders')
    .upsert({ conversation_id: conversationId, data: orderData, expires_at: expiresAt })
}

export async function getPendingOrder(conversationId) {
  const { data } = await supabaseAdmin
    .from('pending_orders')
    .select('data, expires_at')
    .eq('conversation_id', conversationId)
    .single()
  if (!data) return null
  if (new Date(data.expires_at) < new Date()) {
    await deletePendingOrder(conversationId)
    return null
  }
  return data.data
}

export async function deletePendingOrder(conversationId) {
  await supabaseAdmin
    .from('pending_orders')
    .delete()
    .eq('conversation_id', conversationId)
}

/**
 * Atomik: pending order'ı tek işlemde okur ve siler.
 * Eş zamanlı iki callback gelirse sadece biri data alır, diğeri null görür.
 * Double charge'ı önler.
 */
export async function claimPendingOrder(conversationId) {
  const { data } = await supabaseAdmin
    .from('pending_orders')
    .delete()
    .eq('conversation_id', conversationId)
    .gt('expires_at', new Date().toISOString())
    .select('data')
    .single()
  return data?.data ?? null
}

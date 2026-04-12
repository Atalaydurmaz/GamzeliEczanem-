import { supabaseAdmin } from './supabase'

export async function getMessages() {
  const { data } = await supabaseAdmin
    .from('messages')
    .select('*')
    .order('tarih', { ascending: false })
  return data || []
}

export async function createMessage({ ad, email, telefon, konu, mesaj, siparisNo }) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      ad,
      email: email.toLowerCase(),
      telefon: telefon || null,
      konu,
      mesaj,
      siparis_no: siparisNo || null,
      tarih: new Date().toISOString(),
      okundu: false,
      cevap: null,
      cevap_tarihi: null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markRead(id) {
  await supabaseAdmin.from('messages').update({ okundu: true }).eq('id', id)
}

export async function replyMessage(id, cevap) {
  await supabaseAdmin
    .from('messages')
    .update({ cevap, cevap_tarihi: new Date().toISOString(), okundu: true })
    .eq('id', id)
}

export async function deleteMessage(id) {
  await supabaseAdmin.from('messages').delete().eq('id', id)
}

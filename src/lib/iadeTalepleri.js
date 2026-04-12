import { supabaseAdmin } from './supabase'

export async function createIadeTalebi(talebi) {
  const { data, error } = await supabaseAdmin.from('iade_talepleri').insert({
    siparis_no:    talebi.siparisNo,
    musteri_email: talebi.musteriEmail,
    musteri_ad:    talebi.musteriAd,
    urunler:       talebi.urunler,
    neden:         talebi.neden,
    aciklama:      talebi.aciklama || null,
  }).select().single()
  return { ok: !error, data }
}

export async function getIadeTalepleriByEmail(email) {
  const { data } = await supabaseAdmin
    .from('iade_talepleri')
    .select('*')
    .eq('musteri_email', email)
    .order('tarih', { ascending: false })
  return data || []
}

export async function getAllIadeTalepleri() {
  const { data } = await supabaseAdmin
    .from('iade_talepleri')
    .select('*')
    .order('tarih', { ascending: false })
  return data || []
}

export async function updateIadeDurum(id, durum, adminNotu = null) {
  const { error } = await supabaseAdmin
    .from('iade_talepleri')
    .update({ durum, ...(adminNotu && { admin_notu: adminNotu }) })
    .eq('id', id)
  return !error
}

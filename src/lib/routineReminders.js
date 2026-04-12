import { supabaseAdmin } from './supabase'

export async function scheduleReminders(siparisNo, email, adSoyad, sepet, siparisTarihi, getOmur) {
  const rows = []
  for (const item of sepet) {
    const rafOmruGun = getOmur(item)
    if (!rafOmruGun) continue
    const planlanmaTarihi = new Date(siparisTarihi)
    planlanmaTarihi.setDate(planlanmaTarihi.getDate() + rafOmruGun)
    rows.push({
      email,
      ad_soyad:         adSoyad,
      siparis_no:       siparisNo,
      urun_id:          item.id,
      urun_ad:          item.ad,
      urun_gorsel:      item.gorsel,
      urun_fiyat:       item.fiyat,
      urun_kategori:    item.kategori,
      raf_omru_gun:     rafOmruGun,
      planlanma_tarihi: planlanmaTarihi.toISOString(),
      gonderildi:       false,
      olusturma:        siparisTarihi,
    })
  }
  if (rows.length > 0) {
    await supabaseAdmin.from('routine_reminders').insert(rows)
  }
}

export async function getDueReminders() {
  const { data } = await supabaseAdmin
    .from('routine_reminders')
    .select('*')
    .eq('gonderildi', false)
    .lte('planlanma_tarihi', new Date().toISOString())
  return data || []
}

export async function markReminderSent(id) {
  await supabaseAdmin
    .from('routine_reminders')
    .update({ gonderildi: true, gonderilme_tarihi: new Date().toISOString() })
    .eq('id', id)
}

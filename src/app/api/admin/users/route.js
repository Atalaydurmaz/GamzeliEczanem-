import { isAdmin } from '@/lib/adminAuth'

import { supabaseAdmin } from '@/lib/supabase'


export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, ad, email, kayit_tarihi, sifre_hash')
    .order('kayit_tarihi', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('musteri, genel_toplam, tarih')

  const orderMap = {}
  for (const o of orders || []) {
    const email = o.musteri?.email?.toLowerCase()
    if (!email) continue
    if (!orderMap[email]) orderMap[email] = { siparisSayisi: 0, toplamHarcama: 0, sonSiparis: null }
    orderMap[email].siparisSayisi++
    orderMap[email].toplamHarcama += Number(o.genel_toplam) || 0
    if (!orderMap[email].sonSiparis || new Date(o.tarih) > new Date(orderMap[email].sonSiparis)) {
      orderMap[email].sonSiparis = o.tarih
    }
  }

  const result = (users || []).map((u) => {
    const stats = orderMap[u.email?.toLowerCase()] || { siparisSayisi: 0, toplamHarcama: 0, sonSiparis: null }
    return {
      id: u.id,
      ad: u.ad,
      email: u.email,
      kayitTarihi: u.kayit_tarihi,
      googleHesabi: !u.sifre_hash,
      ...stats,
    }
  })

  return Response.json(result)
}

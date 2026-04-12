import { isAdmin } from '@/lib/adminAuth'

import { supabaseAdmin } from '@/lib/supabase'


export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const [{ data, error }, { data: stocks }] = await Promise.all([
    supabaseAdmin.from('products').select('*').order('id', { ascending: true }),
    supabaseAdmin.from('stock').select('urun_id, stok'),
  ])
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const stokMap = Object.fromEntries((stocks || []).map(s => [s.urun_id, s.stok]))
  const merged = data.map(p => ({ ...p, stok: stokMap[p.id] ?? 0 }))
  return Response.json(merged)
}

export async function POST(req) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      id:           body.id,
      ad:           body.ad,
      kategori:     body.kategori,
      alt_kategori: body.altKategori || null,
      fiyat:        Number(body.fiyat),
      eski_fiyat:   body.eskiFiyat ? Number(body.eskiFiyat) : null,
      aciklama:     body.aciklama || null,
      detay:        body.detay || null,
      gorsel:       body.gorsel || null,
      etiket:       body.etiket || null,
      aktif:        body.aktif !== false,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Stok kaydı oluştur
  await supabaseAdmin
    .from('stock')
    .upsert({ urun_id: body.id, stok: Number(body.stok) || 0 }, { onConflict: 'urun_id' })

  return Response.json(data, { status: 201 })
}

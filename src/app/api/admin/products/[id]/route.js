import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { parseBody, AdminProductUpdateSchema } from '@/lib/validate'

export async function PATCH(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { id } = await params

  const parsed = await parseBody(AdminProductUpdateSchema, req)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  const updates = {}
  if (body.ad           !== undefined) updates.ad           = body.ad
  if (body.kategori     !== undefined) updates.kategori     = body.kategori
  if (body.altKategori  !== undefined) updates.alt_kategori = body.altKategori
  if (body.fiyat        !== undefined) updates.fiyat        = body.fiyat
  if (body.eskiFiyat    !== undefined) updates.eski_fiyat   = body.eskiFiyat ?? null
  if (body.aciklama     !== undefined) updates.aciklama     = body.aciklama
  if (body.detay        !== undefined) updates.detay        = body.detay
  if (body.gorsel       !== undefined) updates.gorsel       = body.gorsel
  if (body.etiket       !== undefined) updates.etiket       = body.etiket ?? null
  if (body.aktif        !== undefined) updates.aktif        = body.aktif

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', Number(id))
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 400 })

  // Stok güncellemesi varsa
  if (body.stok !== undefined) {
    await supabaseAdmin
      .from('stock')
      .upsert({ urun_id: Number(id), stok: Math.max(0, Number(body.stok)) }, { onConflict: 'urun_id' })
  }

  // Fiyat/stok değişince ilgili sayfaların Next.js cache'ini temizle
  revalidatePath(`/urunler/${id}`)
  revalidatePath('/urunler')

  return Response.json(data)
}

export async function DELETE(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { id } = await params

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', Number(id))

  if (error) return Response.json({ error: error.message }, { status: 400 })

  revalidatePath(`/urunler/${id}`)
  revalidatePath('/urunler')

  return Response.json({ ok: true })
}

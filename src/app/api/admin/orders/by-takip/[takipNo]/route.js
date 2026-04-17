import { isAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET — Kargo takip no'ya göre sipariş döner.
 * Etiket yazdırma sayfası bunu kullanır (alıcı adı/adres/tel lazım).
 */
export async function GET(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const { takipNo } = await params
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('siparis_no, tarih, musteri, teslimat')
    .eq('kargo_takip_no', takipNo)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Sipariş bulunamadı' }, { status: 404 })

  return Response.json({
    siparis: {
      siparisNo: data.siparis_no,
      tarih: data.tarih,
      musteri: data.musteri,
      teslimat: data.teslimat,
    },
  })
}

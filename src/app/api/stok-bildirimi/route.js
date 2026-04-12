import { addNotification } from '@/lib/stockNotifications'
import { getUrunStock } from '@/lib/stock'
import { parseBody, StokBildirimiSchema } from '@/lib/validate'

export async function POST(req) {
  const parsed = await parseBody(StokBildirimiSchema, req)
  if (!parsed.ok) return parsed.response
  const { urunId, email } = parsed.data

  // Stok zaten varsa kaydetme
  const stok = await getUrunStock(urunId)
  if (stok > 0) {
    return Response.json({ ok: false, hata: 'Ürün zaten stokta' }, { status: 400 })
  }

  const eklendi = await addNotification(urunId, email)
  if (!eklendi) {
    return Response.json({ ok: false, zatenKayitli: true })
  }

  return Response.json({ ok: true })
}

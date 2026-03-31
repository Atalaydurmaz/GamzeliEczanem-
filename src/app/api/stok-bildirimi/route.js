import { addNotification } from '@/lib/stockNotifications'
import { getUrunStock } from '@/lib/stock'

export async function POST(req) {
  const { urunId, email } = await req.json()

  if (!urunId || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, hata: 'Geçersiz istek' }, { status: 400 })
  }

  // Stok zaten varsa kaydetme
  const stok = getUrunStock(urunId)
  if (stok > 0) {
    return Response.json({ ok: false, hata: 'Ürün zaten stokta' }, { status: 400 })
  }

  const eklendi = addNotification(urunId, email)
  if (!eklendi) {
    return Response.json({ ok: false, zatenKayitli: true })
  }

  return Response.json({ ok: true })
}

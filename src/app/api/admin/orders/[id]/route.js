import { cookies } from 'next/headers'
import { updateOrderStatus, getOrderBySiparisNo } from '@/lib/orders'
import { incrementStock } from '@/lib/stock'

async function isAdmin() {
  const store = await cookies()
  return store.get('gla_admin')?.value === process.env.ADMIN_PASSWORD
}

export async function PATCH(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { durum } = await req.json()
  const { id } = await params

  if (durum === 'İptal Edildi') {
    const siparis = getOrderBySiparisNo(id)
    if (siparis) {
      for (const item of siparis.urunler) {
        incrementStock(item.id, item.adet)
      }
    }
  }

  const ok = updateOrderStatus(id, durum)
  return Response.json({ ok })
}

import { getOrderBySiparisNo, updateOrderStatus } from '@/lib/orders'

export async function POST(req, { params }) {
  const { siparisNo } = await params
  const { email } = await req.json()

  if (!email) return Response.json({ error: 'E-posta gerekli' }, { status: 400 })

  const siparis = getOrderBySiparisNo(siparisNo)
  if (!siparis) return Response.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
  if (siparis.musteri.email.toLowerCase() !== email.toLowerCase()) {
    return Response.json({ error: 'Yetkisiz' }, { status: 403 })
  }
  if (siparis.durum !== 'Hazırlanıyor') {
    return Response.json({ error: 'Bu sipariş iptal edilemez' }, { status: 400 })
  }

  updateOrderStatus(siparisNo, 'İptal Talebi')
  return Response.json({ ok: true })
}

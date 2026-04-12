import { getOrderBySiparisNo, updateOrderStatus } from '@/lib/orders'
import { getCurrentUserEmail } from '@/lib/userAuth'
import { cancelDiscountUsage } from '@/lib/discountCodes'

export async function POST(req, { params }) {
  const { siparisNo } = await params

  // ── Kimlik doğrulama (session) ───────────────────────────────────────────
  // Body'deki email GÜVEN DIŞIDIR — saldırgan farklı email gönderebilir.
  // Sahiplik her zaman HttpOnly cookie / NextAuth session'dan doğrulanır.
  const sessionEmail = await getCurrentUserEmail()
  if (!sessionEmail) {
    return Response.json({ error: 'Bu işlem için giriş yapmanız gerekiyor.' }, { status: 401 })
  }
  // ────────────────────────────────────────────────────────────────────────

  const siparis = await getOrderBySiparisNo(siparisNo)
  if (!siparis) {
    return Response.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  }

  // Sahiplik kontrolü: session email ile siparişin müşteri emaili karşılaştırılır
  if (siparis.musteri?.email?.toLowerCase() !== sessionEmail.toLowerCase()) {
    return Response.json({ error: 'Bu siparişe erişim yetkiniz yok.' }, { status: 403 })
  }

  if (siparis.durum !== 'Hazırlanıyor') {
    return Response.json({ error: 'Bu sipariş artık iptal edilemez.' }, { status: 400 })
  }

  await updateOrderStatus(siparisNo, 'İptal Talebi')

  // Siparişte kupon kullanıldıysa kullanım hakkını geri ver
  if (siparis.indirim_kodu) {
    await cancelDiscountUsage(siparisNo)
  }

  return Response.json({ ok: true })
}

import { getOrders } from '@/lib/orders'
import { getCurrentUserEmail } from '@/lib/userAuth'

export async function GET() {
  const email = await getCurrentUserEmail()
  if (!email) return Response.json({ hata: 'Giriş gerekli' }, { status: 401 })
  const orders = await getOrders()
  const musteri = orders.filter((o) => o.musteri?.email?.toLowerCase() === email)
  return Response.json(musteri)
}

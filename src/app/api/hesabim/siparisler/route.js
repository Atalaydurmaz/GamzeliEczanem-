import { getOrders } from '@/lib/orders'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  if (!email) return Response.json([])
  const orders = getOrders()
  const musteri = orders.filter((o) => o.musteri?.email?.toLowerCase() === email.toLowerCase())
  return Response.json(musteri)
}

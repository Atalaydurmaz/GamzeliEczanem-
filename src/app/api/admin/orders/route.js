import { isAdmin } from '@/lib/adminAuth'

import { getOrders } from '@/lib/orders'


export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  return Response.json(await getOrders())
}

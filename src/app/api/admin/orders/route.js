import { cookies } from 'next/headers'
import { getOrders } from '@/lib/orders'

async function isAdmin() {
  const store = await cookies()
  return store.get('gla_admin')?.value === process.env.ADMIN_PASSWORD
}

export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  return Response.json(getOrders())
}

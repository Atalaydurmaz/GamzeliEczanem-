import { isAdmin } from '@/lib/adminAuth'

export async function GET() {
  if (await isAdmin()) return Response.json({ ok: true })
  return Response.json({ ok: false }, { status: 401 })
}

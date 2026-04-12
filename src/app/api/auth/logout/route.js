import { clearUserSessionCookie } from '@/lib/userAuth'

export async function POST() {
  await clearUserSessionCookie()
  return Response.json({ ok: true })
}

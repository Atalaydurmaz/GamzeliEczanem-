import { cookies } from 'next/headers'

export async function POST() {
  const store = await cookies()
  store.delete('gla_admin')
  return Response.json({ ok: true })
}

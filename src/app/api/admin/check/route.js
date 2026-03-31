import { cookies } from 'next/headers'

export async function GET() {
  const store = await cookies()
  const token = store.get('gla_admin')?.value
  if (token && token === process.env.ADMIN_PASSWORD) {
    return Response.json({ ok: true })
  }
  return Response.json({ ok: false }, { status: 401 })
}

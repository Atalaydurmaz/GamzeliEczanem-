import { cookies } from 'next/headers'

export async function POST(req) {
  const { sifre } = await req.json()
  if (sifre !== process.env.ADMIN_PASSWORD) {
    return Response.json({ ok: false }, { status: 401 })
  }
  const store = await cookies()
  store.set('gla_admin', process.env.ADMIN_PASSWORD, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 gün
    path: '/',
  })
  return Response.json({ ok: true })
}

import { isAdmin } from '@/lib/adminAuth'

import { getAllIadeTalepleri, updateIadeDurum } from '@/lib/iadeTalepleri'


export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  return Response.json(await getAllIadeTalepleri())
}

export async function PATCH(req) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { id, durum, adminNotu } = await req.json()
  const ok = await updateIadeDurum(id, durum, adminNotu)
  return Response.json({ ok })
}

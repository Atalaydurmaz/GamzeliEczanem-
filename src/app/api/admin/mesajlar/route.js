import { isAdmin } from '@/lib/adminAuth'

import { getMessages, markRead, replyMessage, deleteMessage } from '@/lib/messages'


export async function GET() {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  return Response.json(await getMessages())
}

export async function PATCH(req) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { id, action, cevap } = await req.json()

  if (action === 'okundu') {
    await markRead(id)
  } else if (action === 'cevapla' && cevap) {
    await replyMessage(id, cevap)
  }

  return Response.json({ ok: true })
}

export async function DELETE(req) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  const { id } = await req.json()
  await deleteMessage(id)
  return Response.json({ ok: true })
}

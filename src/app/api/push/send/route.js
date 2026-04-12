import { NextResponse } from 'next/server'
import webpush from 'web-push'
import fs from 'fs'
import path from 'path'
import { isAdmin } from '@/lib/adminAuth'

const FILE = path.join(process.cwd(), 'data', 'push-subscriptions.json')

export async function POST(req) {
  if (!await isAdmin()) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz' }, { status: 401 })
  }

  if (!process.env.VAPID_EMAIL || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, error: 'VAPID keys not configured' }, { status: 500 })
  }
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const body = await req.json()
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
  const pushBody = typeof body.body === 'string' ? body.body.trim().slice(0, 500) : ''

  if (!title) {
    return NextResponse.json({ ok: false, error: 'Bildirim başlığı zorunludur.' }, { status: 400 })
  }

  let list = []
  try {
    list = JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return NextResponse.json({ ok: true })
  }

  const payload = JSON.stringify({ title, body: pushBody })

  const results = await Promise.allSettled(
    list.map((sub) => webpush.sendNotification(sub, payload))
  )

  // 410 Gone = abonelik sona ermiş, listeden çıkar
  const valid = list.filter(
    (_, i) => !(results[i].status === 'rejected' && results[i].reason?.statusCode === 410)
  )
  if (valid.length !== list.length) {
    fs.writeFileSync(FILE, JSON.stringify(valid, null, 2))
  }

  return NextResponse.json({ ok: true })
}

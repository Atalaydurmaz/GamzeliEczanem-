import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'push-subscriptions.json')

function read() {
  try {
    if (!fs.existsSync(FILE)) return []
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return []
  }
}

export async function POST(req) {
  const sub = await req.json()
  const list = read()
  if (!list.some((s) => s.endpoint === sub.endpoint)) {
    list.push(sub)
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2))
  }
  return NextResponse.json({ ok: true })
}

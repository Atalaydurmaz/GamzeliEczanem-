import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'stockNotifications.json')

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

function write(data) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function addNotification(urunId, email) {
  const list = read()
  const zatenVar = list.some(
    (n) => n.urunId === urunId && n.email.toLowerCase() === email.toLowerCase()
  )
  if (zatenVar) return false
  list.push({ urunId, email, tarih: new Date().toISOString() })
  write(list)
  return true
}

export function getNotificationsForUrun(urunId) {
  return read().filter((n) => n.urunId === urunId)
}

export function clearNotificationsForUrun(urunId) {
  const list = read().filter((n) => n.urunId !== urunId)
  write(list)
}

import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'abandonedCarts.json')

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

// Save or update a cart for an email address
export function upsertAbandonedCart(email, sepet, toplamFiyat) {
  const list = read()
  const idx = list.findIndex((c) => c.email.toLowerCase() === email.toLowerCase())
  const kayit = {
    email,
    sepet,
    toplamFiyat,
    guncelleme: new Date().toISOString(),
    emailGonderildi: false,
  }
  if (idx === -1) {
    kayit.id = crypto.randomUUID()
    kayit.olusturma = kayit.guncelleme
    list.push(kayit)
  } else {
    // Reset emailGonderildi if cart changed so we can send again
    list[idx] = { ...list[idx], ...kayit }
  }
  write(list)
}

// Get carts abandoned for more than `dakika` minutes, email not yet sent
export function getAbandonedCarts(dakika = 60) {
  const sinir = new Date(Date.now() - dakika * 60 * 1000).toISOString()
  return read().filter(
    (c) => !c.emailGonderildi && c.guncelleme < sinir && c.sepet?.length > 0
  )
}

export function markEmailSent(email) {
  const list = read()
  const idx = list.findIndex((c) => c.email.toLowerCase() === email.toLowerCase())
  if (idx !== -1) {
    list[idx].emailGonderildi = true
    write(list)
  }
}

export function deleteAbandonedCart(email) {
  const list = read().filter((c) => c.email.toLowerCase() !== email.toLowerCase())
  write(list)
}

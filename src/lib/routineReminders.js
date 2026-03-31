import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'routineReminders.json')

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

export function scheduleReminders(siparisNo, email, adSoyad, sepet, siparisTarihi, getOmur) {
  const list = read()

  for (const item of sepet) {
    const rafOmruGun = getOmur(item)
    if (!rafOmruGun) continue

    const planlanmaTarihi = new Date(siparisTarihi)
    planlanmaTarihi.setDate(planlanmaTarihi.getDate() + rafOmruGun)

    list.push({
      id: crypto.randomUUID(),
      email,
      adSoyad,
      siparisNo,
      urunId: item.id,
      urunAd: item.ad,
      urunGorsel: item.gorsel,
      urunFiyat: item.fiyat,
      urunKategori: item.kategori,
      rafOmruGun,
      planlanmaTarihi: planlanmaTarihi.toISOString(),
      gonderildi: false,
      olusturma: siparisTarihi,
    })
  }

  write(list)
}

// Returns reminders due today or earlier that haven't been sent yet
export function getDueReminders() {
  const now = new Date().toISOString()
  return read().filter((r) => !r.gonderildi && r.planlanmaTarihi <= now)
}

export function markReminderSent(id) {
  const list = read()
  const idx = list.findIndex((r) => r.id === id)
  if (idx !== -1) {
    list[idx].gonderildi = true
    list[idx].gonderilmeTarihi = new Date().toISOString()
    write(list)
  }
}

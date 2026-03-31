import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'reviews.json')

export function getReviews() {
  if (!fs.existsSync(DATA_FILE)) return []
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) } catch { return [] }
}

export function getReviewsByProduct(urunId) {
  const id = parseInt(urunId, 10)
  return getReviews()
    .filter((r) => r.urunId === id)
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
}

export function addReview(review) {
  const reviews = getReviews()
  reviews.push(review)
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2))
}

export function getStats() {
  const reviews = getReviews()
  const stats = {}
  for (const r of reviews) {
    if (!stats[r.urunId]) stats[r.urunId] = { toplam: 0, sayi: 0 }
    stats[r.urunId].toplam += r.puan
    stats[r.urunId].sayi += 1
  }
  const result = {}
  for (const [id, s] of Object.entries(stats)) {
    result[id] = {
      puan: Math.round((s.toplam / s.sayi) * 10) / 10,
      yorumSayisi: s.sayi,
    }
  }
  return result
}

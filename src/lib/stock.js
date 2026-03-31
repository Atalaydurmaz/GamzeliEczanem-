import fs from 'fs'
import path from 'path'

const STOCK_FILE = path.join(process.cwd(), 'data', 'stock.json')

function readStock() {
  try {
    return JSON.parse(fs.readFileSync(STOCK_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function writeStock(data) {
  fs.writeFileSync(STOCK_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getStock() {
  return readStock()
}

export function getUrunStock(urunId) {
  const stock = readStock()
  const stok = stock[String(urunId)]
  return stok === undefined ? 0 : stok
}

export function updateStock(urunId, yeniStok) {
  const stock = readStock()
  stock[String(urunId)] = Math.max(0, yeniStok)
  writeStock(stock)
  return stock[String(urunId)]
}

export function decrementStock(urunId, adet = 1) {
  const stock = readStock()
  const mevcutStok = stock[String(urunId)] ?? 0
  stock[String(urunId)] = Math.max(0, mevcutStok - adet)
  writeStock(stock)
  return stock[String(urunId)]
}

export function incrementStock(urunId, adet = 1) {
  const stock = readStock()
  const mevcutStok = stock[String(urunId)] ?? 0
  stock[String(urunId)] = mevcutStok + adet
  writeStock(stock)
  return stock[String(urunId)]
}

export function getLowStockUrunler(esik = 5) {
  const stock = readStock()
  return Object.entries(stock)
    .filter(([, stok]) => stok > 0 && stok < esik)
    .map(([id, stok]) => ({ id: Number(id), stok }))
}

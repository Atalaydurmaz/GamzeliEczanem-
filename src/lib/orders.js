import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'orders.json')

export function getOrders() {
  if (!fs.existsSync(DATA_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function saveOrder(order) {
  const orders = getOrders()
  orders.unshift(order)
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2))
}

export function getOrderBySiparisNo(siparisNo) {
  return getOrders().find((o) => o.siparisNo === siparisNo) ?? null
}

export function updateOrderStatus(siparisNo, durum) {
  const orders = getOrders()
  const idx = orders.findIndex((o) => o.siparisNo === siparisNo)
  if (idx === -1) return false
  orders[idx].durum = durum
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2))
  return true
}

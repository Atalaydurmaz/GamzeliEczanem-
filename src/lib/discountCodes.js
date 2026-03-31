import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'discountCodes.json')

function readCodes() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeCodes(codes) {
  fs.writeFileSync(FILE, JSON.stringify(codes, null, 2), 'utf-8')
}

export function validateDiscountCode(kod, toplamFiyat) {
  const codes = readCodes()
  const code = codes.find((c) => c.kod.toUpperCase() === kod.trim().toUpperCase())

  if (!code) return { gecerli: false, hata: 'Geçersiz indirim kodu' }
  if (!code.aktif) return { gecerli: false, hata: 'Bu indirim kodu artık aktif değil' }
  if (code.kullanimLimit !== null && code.kullanimSayisi >= code.kullanimLimit)
    return { gecerli: false, hata: 'Bu indirim kodunun kullanım limiti doldu' }
  if (toplamFiyat < code.minSiparis)
    return {
      gecerli: false,
      hata: `Bu kod için minimum sipariş tutarı ${code.minSiparis.toLocaleString('tr-TR')} ₺`,
    }

  const indirimTutari =
    code.tip === 'yuzde'
      ? Math.round((toplamFiyat * code.deger) / 100)
      : Math.min(code.deger, toplamFiyat)

  return {
    gecerli: true,
    kod: code.kod,
    tip: code.tip,
    deger: code.deger,
    indirimTutari,
  }
}

export function incrementUsage(kod) {
  const codes = readCodes()
  const idx = codes.findIndex((c) => c.kod.toUpperCase() === kod.trim().toUpperCase())
  if (idx === -1) return
  codes[idx].kullanimSayisi += 1
  writeCodes(codes)
}

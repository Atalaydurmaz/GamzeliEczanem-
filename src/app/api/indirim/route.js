import { validateDiscountCode } from '@/lib/discountCodes'

export async function POST(req) {
  const { kod, toplamFiyat } = await req.json()
  if (!kod || typeof toplamFiyat !== 'number') {
    return Response.json({ gecerli: false, hata: 'Eksik parametre' }, { status: 400 })
  }
  const sonuc = validateDiscountCode(kod, toplamFiyat)
  return Response.json(sonuc)
}

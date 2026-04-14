import { validateDiscountCode } from '@/lib/discountCodes'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { parseBody, IndirimSchema } from '@/lib/validate'

export async function POST(req) {
  // Rate limit: IP başına dakikada 20 kupon denemesi (brute force koruması)
  const ip = getIp(req)
  const rl = await rateLimit(`indirim:${ip}`, 20, 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { gecerli: false, hata: 'Çok fazla deneme. Lütfen bekleyin.' },
      { status: 429 }
    )
  }

  const parsed = await parseBody(IndirimSchema, req)
  if (!parsed.ok) return parsed.response
  const { kod, toplamFiyat } = parsed.data

  const sonuc = await validateDiscountCode(kod, toplamFiyat)
  return Response.json(sonuc)
}

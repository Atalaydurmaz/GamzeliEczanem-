import { upsertAbandonedCart, deleteAbandonedCart } from '@/lib/abandonedCarts'

export async function POST(req) {
  const { email, sepet, toplamFiyat } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(sepet)) {
    return Response.json({ ok: false }, { status: 400 })
  }

  upsertAbandonedCart(email, sepet, toplamFiyat)
  return Response.json({ ok: true })
}

export async function DELETE(req) {
  const { email } = await req.json()
  if (email) deleteAbandonedCart(email)
  return Response.json({ ok: true })
}

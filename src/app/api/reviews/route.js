import { getReviewsByProduct, addReview } from '@/lib/reviews'

export async function GET(req) {
  const urunId = new URL(req.url).searchParams.get('urunId')
  if (!urunId) return Response.json([], { status: 400 })
  return Response.json(getReviewsByProduct(urunId))
}

export async function POST(req) {
  const { urunId, kullaniciAd, puan, yorum, fotolar } = await req.json()

  if (!urunId || !kullaniciAd || !puan || !yorum?.trim()) {
    return Response.json({ error: 'Eksik alan' }, { status: 400 })
  }
  if (puan < 1 || puan > 5) {
    return Response.json({ error: 'Geçersiz puan' }, { status: 400 })
  }
  if (yorum.trim().length < 10) {
    return Response.json({ error: 'Yorum en az 10 karakter olmalı' }, { status: 400 })
  }

  const review = {
    id: Date.now(),
    urunId: parseInt(urunId, 10),
    kullaniciAd: kullaniciAd.trim(),
    puan,
    yorum: yorum.trim(),
    tarih: new Date().toISOString(),
    ...(Array.isArray(fotolar) && fotolar.length > 0 && { fotolar }),
  }

  addReview(review)
  return Response.json(review, { status: 201 })
}

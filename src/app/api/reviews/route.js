import { getReviews, getReviewsByProduct, addReview } from '@/lib/reviews'
import { parseBody, ReviewSchema } from '@/lib/validate'

export async function GET(req) {
  const urunId = new URL(req.url).searchParams.get('urunId')
  if (!urunId) return Response.json(await getReviews())
  return Response.json(await getReviewsByProduct(urunId))
}

export async function POST(req) {
  const parsed = await parseBody(ReviewSchema, req)
  if (!parsed.ok) return parsed.response
  const { urunId, kullaniciAd, puan, yorum, fotolar } = parsed.data

  const review = {
    id: Date.now(),
    urunId,
    kullaniciAd,
    puan,
    yorum,
    tarih: new Date().toISOString(),
    ...(fotolar && fotolar.length > 0 && { fotolar }),
  }

  await addReview(review)
  return Response.json(review, { status: 201 })
}

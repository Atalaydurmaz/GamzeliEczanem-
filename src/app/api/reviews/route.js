import { getReviews, getReviewsByProduct, addReview } from '@/lib/reviews'
import { parseBody, ReviewSchema } from '@/lib/validate'
import { rateLimit, getIp } from '@/lib/rateLimit'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(req) {
  const urunId = new URL(req.url).searchParams.get('urunId')
  if (!urunId) return Response.json(await getReviews())
  return Response.json(await getReviewsByProduct(urunId))
}

export async function POST(req) {
  // Rate limit: IP başına saatte 5 yorum
  const ip = getIp(req)
  const rl = await rateLimit(`reviews:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { error: 'Çok fazla yorum gönderdiniz. Lütfen bir saat sonra tekrar deneyin.' },
      { status: 429 }
    )
  }

  // Oturum kontrolü: giriş yapmış kullanıcının adını zorunlu kıl
  let kullaniciAdOnaylandi = null
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      // Oturum açık: profil adını DB'den al (manipülasyona kapalı)
      const { data: profil } = await supabase
        .from('profiles')
        .select('ad_soyad')
        .eq('id', user.id)
        .single()
      kullaniciAdOnaylandi = profil?.ad_soyad || user.email.split('@')[0]
    }
  }

  const parsed = await parseBody(ReviewSchema, req)
  if (!parsed.ok) return parsed.response
  const { urunId, kullaniciAd, puan, yorum, fotolar } = parsed.data

  const review = {
    id: Date.now(),
    urunId,
    // Giriş yapılmışsa DB'deki adı kullan, yoksa form alanını kabul et
    kullaniciAd: kullaniciAdOnaylandi ?? kullaniciAd,
    puan,
    yorum,
    tarih: new Date().toISOString(),
    ...(fotolar && fotolar.length > 0 && { fotolar }),
  }

  await addReview(review)
  return Response.json(review, { status: 201 })
}

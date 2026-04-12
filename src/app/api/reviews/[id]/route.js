import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/adminAuth'
import { deleteReview, getReviewById } from '@/lib/reviews'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function DELETE(req, { params }) {
  const { id } = await params

  // Admin her yorumu silebilir
  if (await isAdmin()) {
    const ok = await deleteReview(id)
    return Response.json({ ok })
  }

  // Müşteri sadece kendi yorumunu silebilir
  const store = await cookies()
  const musteriAd = store.get('gla_kullanici_ad')?.value

  const session = await getServerSession(authOptions)
  const sessionAd = session?.user?.name || session?.user?.email

  const adSoyad = musteriAd || sessionAd
  if (!adSoyad) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const review = await getReviewById(id)
  if (!review) return Response.json({ error: 'Yorum bulunamadı' }, { status: 404 })
  if (review.kullanici_adi !== adSoyad) return Response.json({ error: 'Yetkisiz' }, { status: 403 })

  const ok = await deleteReview(id)
  return Response.json({ ok })
}

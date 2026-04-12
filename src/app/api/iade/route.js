import { createIadeTalebi, getIadeTalepleriByEmail } from '@/lib/iadeTalepleri'
import { getOrderBySiparisNo } from '@/lib/orders'
import { getCurrentUserEmail } from '@/lib/userAuth'
import { parseBody, IadeSchema } from '@/lib/validate'

export async function GET() {
  const email = await getCurrentUserEmail()
  if (!email) return Response.json({ error: 'Giriş gerekli' }, { status: 401 })
  return Response.json(await getIadeTalepleriByEmail(email))
}

export async function POST(req) {
  // ── Kimlik doğrulama (session) ───────────────────────────────────────────
  // Body'deki musteriEmail artık sahiplik doğrulaması için KULLANILMAZ.
  // Kötü niyetli kullanıcı body'yi değiştirerek başkasının siparişini
  // iade etmeye çalışabilir; session email bunu engeller.
  const sessionEmail = await getCurrentUserEmail()
  if (!sessionEmail) {
    return Response.json({ error: 'İade talebi için giriş yapmanız gerekiyor.' }, { status: 401 })
  }
  // ────────────────────────────────────────────────────────────────────────

  const parsed = await parseBody(IadeSchema, req)
  if (!parsed.ok) return parsed.response
  const { siparisNo, urunler, neden, aciklama } = parsed.data

  const siparis = await getOrderBySiparisNo(siparisNo)
  if (!siparis) {
    return Response.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  }

  // Sahiplik kontrolü: session email ile siparişin müşteri emaili karşılaştırılır
  if (siparis.musteri?.email?.toLowerCase() !== sessionEmail.toLowerCase()) {
    return Response.json({ error: 'Bu siparişe erişim yetkiniz yok.' }, { status: 403 })
  }

  if (siparis.durum !== 'Teslim Edildi') {
    return Response.json({ error: 'Sadece teslim edilen siparişler iade edilebilir.' }, { status: 400 })
  }

  const { ok, data } = await createIadeTalebi({
    siparisNo,
    musteriEmail: sessionEmail,              // session'dan doğrulanmış email
    musteriAd:    siparis.musteri.adSoyad,
    urunler,
    neden,
    aciklama,
  })

  if (!ok) return Response.json({ error: 'Talep oluşturulamadı.' }, { status: 500 })
  return Response.json(data, { status: 201 })
}

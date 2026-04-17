import { isAdmin } from '@/lib/adminAuth'
import { getOrderBySiparisNo, updateKargoTakipNo } from '@/lib/orders'
import { createShipment, getMode } from '@/lib/yurticiKargo'

/**
 * POST /api/admin/kargo/olustur
 * Body: { siparisNo }
 *
 * Yurtiçi'ye gönderi açar, dönen takipNo'yu orders.kargo_takip_no'ya yazar,
 * sipariş durumunu 'Kargoya Verildi'ye çeker (updateKargoTakipNo içinde).
 *
 * Yanıt: { ok, takipNo, jobId, mod }  (mod: 'mock' | 'real')
 */
export async function POST(req) {
  if (!await isAdmin()) {
    return Response.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const siparisNo = body?.siparisNo
  if (!siparisNo) {
    return Response.json({ error: 'siparisNo gerekli' }, { status: 400 })
  }

  const siparis = await getOrderBySiparisNo(siparisNo)
  if (!siparis) {
    return Response.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
  }

  // Zaten kargo barkodu varsa tekrar oluşturma — idempotent davran
  if (siparis.kargoTakipNo) {
    return Response.json({
      ok: true,
      takipNo: siparis.kargoTakipNo,
      jobId: null,
      mod: getMode(),
      mevcut: true,
    })
  }

  let sonuc
  try {
    sonuc = await createShipment(siparis)
  } catch (e) {
    console.error('Yurtiçi createShipment hatası:', e.message, '| siparis_no:', siparisNo)
    return Response.json({ error: e.message || 'Kargo servisi hatası' }, { status: 502 })
  }

  const ok = await updateKargoTakipNo(siparisNo, sonuc.takipNo)
  if (!ok) {
    // Yurtiçi'de gönderi açıldı ama DB'ye yazamadık — takipNo'yu dön, admin manuel kopyalasın
    console.error('updateKargoTakipNo başarısız, takipNo:', sonuc.takipNo, '| siparis_no:', siparisNo)
    return Response.json({
      error: 'Gönderi açıldı ama DB güncellenemedi. Takip no: ' + sonuc.takipNo,
      takipNo: sonuc.takipNo,
    }, { status: 500 })
  }

  return Response.json({
    ok: true,
    takipNo: sonuc.takipNo,
    jobId: sonuc.jobId,
    mod: sonuc.mod,
  }, { status: 201 })
}

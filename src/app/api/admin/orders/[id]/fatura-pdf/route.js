import { isAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const BUCKET = 'faturalar'
const SIGNED_URL_TTL = 300 // saniye (5 dk) — yazdırma/görüntüleme için

/**
 * teslimat.fatura JSONB alanına yama yapar (pdfPath vb. eklemek için).
 * Fatura objesi yoksa sıfırdan oluşturulur. Fatura nesnesinin içindeki
 * mevcut alanlar korunur.
 */
async function mergeFaturaAlanlari(siparisNo, patch) {
  const { data: row } = await supabaseAdmin
    .from('orders').select('teslimat').eq('siparis_no', siparisNo).single()
  if (!row) return false
  const teslimat = row.teslimat || {}
  const fatura = { ...(teslimat.fatura || {}), ...patch }
  // null değerleri JSONB'de sakla — silme işlemi için false/null ayrımı korunur
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ teslimat: { ...teslimat, fatura } })
    .eq('siparis_no', siparisNo)
  return !error
}

/**
 * POST — Fatura PDF'i yükle.
 * FormData: { pdf: File }
 * Path: `{siparisNo}/{timestamp}.pdf` (siparis prefix'i dosya yönetimini kolaylaştırır)
 */
export async function POST(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id: siparisNo } = await params
  const formData = await req.formData()
  const file = formData.get('pdf')

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'PDF bulunamadı' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return Response.json({ error: 'Sadece PDF yükleyebilirsiniz' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Dosya en fazla 10 MB olabilir' }, { status: 400 })
  }

  // Eski PDF varsa önce sil (tek sipariş = tek PDF)
  const { data: row } = await supabaseAdmin
    .from('orders').select('teslimat').eq('siparis_no', siparisNo).single()
  const eskiPath = row?.teslimat?.fatura?.pdfPath
  if (eskiPath) {
    await supabaseAdmin.storage.from(BUCKET).remove([eskiPath]).catch(() => {})
  }

  const path = `${siparisNo}/${Date.now()}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'application/pdf', upsert: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const ok = await mergeFaturaAlanlari(siparisNo, { pdfPath: path, yuklemeTarihi: new Date().toISOString() })
  if (!ok) {
    // DB update başarısız — storage'ı temizle
    await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => {})
    return Response.json({ error: 'Fatura kaydedilemedi' }, { status: 500 })
  }

  return Response.json({ ok: true, pdfPath: path }, { status: 201 })
}

/**
 * GET — PDF için kısa ömürlü signed URL döner.
 * Admin bu URL'yi yeni sekmede açar, tarayıcı PDF'i gösterir, oradan yazdırır.
 */
export async function GET(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id: siparisNo } = await params
  const { data: row } = await supabaseAdmin
    .from('orders').select('teslimat').eq('siparis_no', siparisNo).single()

  const path = row?.teslimat?.fatura?.pdfPath
  if (!path) return Response.json({ error: 'PDF bulunamadı' }, { status: 404 })

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ url: data.signedUrl })
}

/**
 * DELETE — PDF'i storage'dan ve JSONB'den temizle.
 */
export async function DELETE(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id: siparisNo } = await params
  const { data: row } = await supabaseAdmin
    .from('orders').select('teslimat').eq('siparis_no', siparisNo).single()

  const path = row?.teslimat?.fatura?.pdfPath
  if (path) {
    await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => {})
  }

  const ok = await mergeFaturaAlanlari(siparisNo, { pdfPath: null, yuklemeTarihi: null })
  if (!ok) return Response.json({ error: 'Silinemedi' }, { status: 500 })
  return Response.json({ ok: true })
}

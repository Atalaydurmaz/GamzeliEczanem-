import { sendSms } from '@/lib/notify'

export async function POST(req) {
  const { telefon, siparisNo, adSoyad, genelToplam } = await req.json()

  // Profesyonel ve BTK Uyumlu Mesaj
  const mesaj = `Sayin ${adSoyad}, Gamzelieczanem'den verdiginiz #${siparisNo} nolu siparisiniz alinmistir. Tutar: ${genelToplam.toFixed(2)} TL. Bizi tercih ettiginiz icin tesekkur ederiz. B002`

  const ok = await sendSms({ telefon, mesaj, context: 'siparis-onay' })
  return Response.json({ ok }, { status: ok ? 200 : 500 })
}

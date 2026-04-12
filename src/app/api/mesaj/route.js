import { createMessage } from '@/lib/messages'

export async function POST(req) {
  try {
    const body = await req.json()
    const { ad, email, telefon, konu, mesaj, siparisNo } = body

    if (!ad || !email || !konu || !mesaj) {
      return Response.json({ basarili: false, hata: 'Ad, e-posta, konu ve mesaj zorunludur.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ basarili: false, hata: 'Geçersiz e-posta adresi.' }, { status: 400 })
    }

    await createMessage({ ad, email, telefon, konu, mesaj, siparisNo })
    return Response.json({ basarili: true })
  } catch (e) {
    console.error('mesaj POST error:', e)
    return Response.json({ basarili: false, hata: 'Mesaj gönderilemedi.' }, { status: 500 })
  }
}

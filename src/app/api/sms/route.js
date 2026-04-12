export async function POST(req) {
  const { telefon, siparisNo, adSoyad, genelToplam } = await req.json()

  // 05321234567 → 905321234567
  const gsmno = telefon.replace(/\s/g, '').replace(/^0/, '90')

  // Profesyonel ve BTK Uyumlu Mesaj
  const mesaj = `Sayin ${adSoyad}, Gamzelieczanem'den verdiginiz #${siparisNo} nolu siparisiniz alinmistir. Tutar: ${genelToplam.toFixed(2)} TL. Bizi tercih ettiginiz icin tesekkur ederiz. B002`;

  const url = new URL('https://api.netgsm.com.tr/sms/send/get/')
  url.searchParams.set('usercode', process.env.NETGSM_USER)
  url.searchParams.set('password', process.env.NETGSM_PASS)
  url.searchParams.set('gsmno', gsmno)
  url.searchParams.set('message', mesaj)
  url.searchParams.set('msgheader', process.env.NETGSM_HEADER || 'A.DURMAZ')
  url.searchParams.set('filter', '0')

  try {
    const res = await fetch(url.toString())
    const text = await res.text()
    // Netgsm başarı kodu "00" ile başlar
    if (text.trim().startsWith('00')) {
      return Response.json({ ok: true })
    }
    console.error('Netgsm hata kodu:', text)
    return Response.json({ ok: false, error: text }, { status: 500 })
  } catch (err) {
    console.error('SMS gönderilemedi:', err.message)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

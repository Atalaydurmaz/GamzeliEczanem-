export async function GET() {
  const user = process.env.NETGSM_USER
  const pass = process.env.NETGSM_PASS
  const header = process.env.NETGSM_HEADER || 'A.DURMAZ'
  const mesaj = 'test'

  const formatlar = ['905316651834', '5316651834', '05316651834']
  const sonuclar = {}

  for (const gsmno of formatlar) {
    const url = new URL('https://api.netgsm.com.tr/sms/send/get/')
    url.searchParams.set('usercode', user)
    url.searchParams.set('password', pass)
    url.searchParams.set('gsmno', gsmno)
    url.searchParams.set('message', mesaj)
    url.searchParams.set('msgheader', header)

    try {
      const res = await fetch(url.toString())
      sonuclar[gsmno] = await res.text()
    } catch (e) {
      sonuclar[gsmno] = 'HATA: ' + e.message
    }
  }

  return Response.json(sonuclar)
}

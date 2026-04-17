import { aiArama } from '@/lib/aiArama'

export async function POST(request) {
  try {
    const { sorgu } = await request.json()
    if (!sorgu?.trim()) return Response.json({ error: 'Sorgu boş' }, { status: 400 })
    const sonuc = await aiArama(sorgu.trim())
    return Response.json(sonuc)
  } catch (error) {
    console.error('Arama API error:', error)
    const mesaj = error?.message?.includes('ANTHROPIC_API_KEY')
      ? 'AI arama şu an kullanılamıyor'
      : 'Arama yapılırken bir hata oluştu'
    return Response.json({ error: mesaj }, { status: 500 })
  }
}

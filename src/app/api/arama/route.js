import Anthropic from '@anthropic-ai/sdk'
import { getProducts } from '@/lib/products'

const client = new Anthropic()

const KATEGORI_ADLARI = {
  'cilt-bakimi': 'Cilt Bakımı',
  makyaj: 'Makyaj',
  parfum: 'Parfüm',
  'sac-bakimi': 'Saç Bakımı',
  'gunes-bakimi': 'Güneş Koruyucu',
  'anne-bebek': 'Anne & Bebek',
}

function buildCatalog(urunler) {
  return urunler
    .map(u => `${u.id}|${u.ad}|${KATEGORI_ADLARI[u.kategori] ?? u.kategori}|${u.altKategori ?? ''}|${u.fiyat}₺|${u.aciklama ?? ''}`)
    .join('\n')
}

const SYSTEM = `Sen GAMZELİECZANEM eczanesinin akıllı arama motorusun.
Kullanıcı doğal Türkçe ile arama yaptığında sorgudaki ihtiyacı, cilt tipini, sorunu ve hedefi anlayıp en uygun ürünleri bul.
Yalnızca verilen katalogdaki ürün ID'lerini kullan.`

export async function POST(request) {
  try {
    const { sorgu } = await request.json()
    if (!sorgu?.trim()) return Response.json({ error: 'Sorgu boş' }, { status: 400 })

    const tumUrunler = await getProducts()

    const prompt = `Kullanıcı Arama Sorgusu: "${sorgu}"

ÜRÜN KATALOĞU (ID|Ad|Kategori|AltKategori|Fiyat|Açıklama):
${buildCatalog(tumUrunler)}

Kullanıcının doğal dil sorgusunu analiz et ve en uygun 4-8 ürünü bul.
SADECE şu JSON formatında yanıt ver, başka hiçbir şey ekleme:
{
  "aciklama": "Uzman bakışıyla kısa analiz ve öneri açıklaması (1-2 cümle)",
  "urunIdleri": [id1, id2, id3, id4]
}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(cleaned)

    const urunler = (parsed.urunIdleri || [])
      .map(id => tumUrunler.find(u => u.id === id))
      .filter(Boolean)

    return Response.json({ aciklama: parsed.aciklama, urunler })
  } catch (error) {
    console.error('Arama API error:', error)
    return Response.json({ error: 'Arama yapılırken bir hata oluştu' }, { status: 500 })
  }
}

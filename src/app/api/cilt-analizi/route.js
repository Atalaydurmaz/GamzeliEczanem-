import Anthropic from '@anthropic-ai/sdk'
import { getProducts } from '@/lib/products'

const client = new Anthropic()

const ILGILI_KATEGORILER = ['cilt-bakimi', 'gunes-bakimi', 'sac-bakimi']

const KATEGORI_ADLARI = {
  'cilt-bakimi': 'Cilt Bakımı',
  'gunes-bakimi': 'Güneş Koruyucu',
  'sac-bakimi': 'Saç Bakımı',
  makyaj: 'Makyaj',
}

const SYSTEM = `Sen GAMZELİECZANEM eczanesinin uzman dermokozmetik eczacı asistanısın.
Türkçe, samimi, bilimsel ve profesyonel yanıtlar ver.
Yalnızca verilen ürün kataloğundaki mevcut ürünleri öner.`

export async function POST(request) {
  try {
    const { ciltTipi, sorun, yas, rutin, butce } = await request.json()

    if (!ciltTipi || !sorun || !yas || !rutin || !butce) {
      return Response.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const tumUrunler = await getProducts()
    const ilgiliUrunler = tumUrunler.filter((u) => ILGILI_KATEGORILER.includes(u.kategori))
    const productList = ilgiliUrunler
      .map((u) => `${u.id}|${u.ad}|${KATEGORI_ADLARI[u.kategori] ?? u.kategori}|${u.fiyat}₺`)
      .join('\n')

    const butceAciklama = {
      Ekonomik: 'Düşük fiyatlı ürünleri tercih et (0-200₺)',
      Orta: 'Orta fiyatlı ürünleri tercih et (150-400₺)',
      Premium: 'Fiyat önemsiz, en kaliteli ürünleri öner',
    }

    const prompt = `Kullanıcı Cilt Profili:
- Cilt Tipi: ${ciltTipi}
- En Büyük Sorun: ${sorun}
- Yaş Grubu: ${yas}
- Mevcut Bakım Rutini: ${rutin}
- Bütçe: ${butce} — ${butceAciklama[butce] ?? ''}

ÜRÜN KATALOĞU (Format: ID|Ürün Adı|Kategori|Fiyat):
${productList}

Bu kullanıcı için kapsamlı bir cilt analizi yap ve katalogdan en uygun 4-5 ürün öner.
SADECE ve SADECE aşağıdaki JSON formatında yanıt ver — başka hiçbir şey ekleme, açıklama yapma:
{
  "analiz": "Kullanıcının cilt profili hakkında kişisel ve uzman tonda analiz (2-3 cümle)",
  "rutin": "Sabah ve akşam bakım adımlarını içeren rutin önerisi (2-3 cümle)",
  "urunIdleri": [id1, id2, id3, id4, id5]
}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(cleaned)

    // ID listesini tam ürün objelerine dönüştür — sayfa client-side lookup yapmasın
    const urunler = (parsed.urunIdleri || [])
      .map((id) => tumUrunler.find((u) => u.id === id))
      .filter(Boolean)

    return Response.json({ analiz: parsed.analiz, rutin: parsed.rutin, urunler })
  } catch (error) {
    console.error('Cilt analizi error:', error)
    return Response.json({ error: 'Analiz yapılırken bir hata oluştu' }, { status: 500 })
  }
}

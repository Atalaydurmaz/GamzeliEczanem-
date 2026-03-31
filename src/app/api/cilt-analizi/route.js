import Anthropic from '@anthropic-ai/sdk'
import { urunler } from '@/lib/data'

const client = new Anthropic()

const ILGILI_KATEGORILER = ['cilt-bakimi', 'gunes-bakimi', 'sac-bakimi']

function buildProductList() {
  const kategoriAdlari = {
    'cilt-bakimi': 'Cilt Bakımı',
    'gunes-bakimi': 'Güneş Koruyucu',
    'sac-bakimi': 'Saç Bakımı',
    makyaj: 'Makyaj',
  }
  return urunler
    .filter((u) => ILGILI_KATEGORILER.includes(u.kategori))
    .map((u) => `${u.id}|${u.ad}|${kategoriAdlari[u.kategori] ?? u.kategori}|${u.fiyat}₺`)
    .join('\n')
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
${buildProductList()}

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
    const data = JSON.parse(cleaned)

    return Response.json(data)
  } catch (error) {
    console.error('Cilt analizi error:', error)
    return Response.json({ error: 'Analiz yapılırken bir hata oluştu' }, { status: 500 })
  }
}

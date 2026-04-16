import Anthropic from '@anthropic-ai/sdk'
import { getProducts } from '@/lib/products'

const client = new Anthropic()

export async function POST(request) {
  try {
    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64) {
      return Response.json({ error: 'Görsel eksik' }, { status: 400 })
    }

    const tumUrunler = await getProducts()
    const catalog = tumUrunler
      .map((u) => `${u.id}|${u.ad}|${u.kategori}|${u.aciklama}`)
      .join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Bu görseli analiz et. Görselde kozmetik, cilt bakımı, makyaj veya güzellik ürünleri görünüyorsa bunları tanımla. Eğer bir kişi ya da cilt görünüyorsa cilt tipini ve ihtiyacını belirle.

ÜRÜN KATALOĞU (ID|Ad|Kategori|Açıklama):
${catalog}

Görsele en uygun 4-8 ürünü katalogdan seç.
SADECE şu JSON formatında yanıt ver, başka hiçbir şey ekleme:
{
  "aciklama": "Görselde ne gördüğüne dair kısa Türkçe açıklama ve neden bu ürünleri önerdiğini anlatan 1-2 cümle",
  "urunIdleri": [id1, id2, id3, id4]
}`,
            },
          ],
        },
      ],
    })

    const raw = response.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(cleaned)

    // ID listesini tam ürün objelerine dönüştür
    const urunler = (parsed.urunIdleri || [])
      .map((id) => tumUrunler.find((u) => u.id === id))
      .filter(Boolean)

    return Response.json({ aciklama: parsed.aciklama, urunler })
  } catch (error) {
    console.error('Görsel arama hatası:', error)
    return Response.json({ error: 'Görsel analiz edilirken hata oluştu' }, { status: 500 })
  }
}

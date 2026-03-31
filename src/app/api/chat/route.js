import Anthropic from '@anthropic-ai/sdk'
import { urunler } from '@/lib/data'

const client = new Anthropic()

function buildProductCatalog() {
  const byCategory = {}
  for (const u of urunler) {
    if (!byCategory[u.kategori]) byCategory[u.kategori] = []
    byCategory[u.kategori].push(`• ${u.ad} — ${u.fiyat.toLocaleString('tr-TR')}₺`)
  }

  const categoryNames = {
    'cilt-bakimi': 'Cilt Bakımı',
    'makyaj': 'Makyaj',
    'parfum': 'Parfüm',
    'sac-bakimi': 'Saç Bakımı',
    'gunes-bakimi': 'Güneş Koruyucu',
  }

  return Object.entries(byCategory)
    .map(([kat, items]) => `[${categoryNames[kat] ?? kat}]\n${items.join('\n')}`)
    .join('\n\n')
}

const SYSTEM_PROMPT = `Sen GAMZELİECZANEM online eczanesi için uzman bir eczacı asistanısın.

GÖREVIN:
- Müşterilerin cilt tipi, saç sorunu veya güzellik ihtiyaçlarını anlayıp uygun ürünleri önermek
- Her zaman Türkçe konuşmak
- Yalnızca aşağıdaki ürün kataloğundaki ürünleri önermek
- Kısa, samimi ve profesyonel cevaplar vermek
- Ürün önerirken fiyatı da belirtmek

ÜRÜN KATALOĞU:
${buildProductCatalog()}

ÖNEMLİ: Listede olmayan ürün önerme. Müşteri sormadıkça uzun açıklamalar yapma.`

export async function POST(request) {
  try {
    const { messages } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Geçersiz mesaj' }, { status: 400 })
    }

    const stream = client.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json({ error: 'Bir hata oluştu' }, { status: 500 })
  }
}

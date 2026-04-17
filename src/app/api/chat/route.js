import { getAnthropicClient } from '@/lib/anthropicClient'
import { getProducts } from '@/lib/products'
import { rateLimit, getIp } from '@/lib/rateLimit'

// ── Katalog cache (5 dakika) ─────────────────────────────────
// Supabase'den her istekte çekmek yerine TTL-cache ile optimize.
let _systemPrompt = null
let _promptTime = 0
const CATALOG_TTL = 5 * 60 * 1000

function buildCatalogText(urunler) {
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

async function getSystemPrompt() {
  if (_systemPrompt && Date.now() - _promptTime < CATALOG_TTL) return _systemPrompt
  const urunler = await getProducts()
  _systemPrompt = `Sen GAMZELİECZANEM online eczanesi için uzman bir eczacı asistanısın.

GÖREVIN:
- Müşterilerin cilt tipi, saç sorunu veya güzellik ihtiyaçlarını anlayıp uygun ürünleri önermek
- Her zaman Türkçe konuşmak
- Yalnızca aşağıdaki ürün kataloğundaki ürünleri önermek
- Kısa, samimi ve profesyonel cevaplar vermek
- Ürün önerirken fiyatı da belirtmek

ÜRÜN KATALOĞU:
${buildCatalogText(urunler)}

ÖNEMLİ: Listede olmayan ürün önerme. Müşteri sormadıkça uzun açıklamalar yapma.`
  _promptTime = Date.now()
  return _systemPrompt
}

export async function POST(request) {
  const ip = getIp(request)
  const rl = await rateLimit(`chat:${ip}`, 20, 60 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      { error: 'Saatlik mesaj limitine ulaştınız. Lütfen bir saat sonra tekrar deneyin.' },
      { status: 429 }
    )
  }

  try {
    const { messages } = await request.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Geçersiz mesaj' }, { status: 400 })
    }

    const systemPrompt = await getSystemPrompt()

    const stream = getAnthropicClient().messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
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

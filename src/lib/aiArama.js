// Yapay zeka destekli ürün arama — sunucu tarafında çalışır.
// Hem /api/arama route'u hem de /arama Server Component bu fonksiyonu kullanır.
import 'server-only'
import { getAnthropicClient } from '@/lib/anthropicClient'
import { getProducts } from '@/lib/products'

const KATEGORI_ADLARI = {
  'cilt-bakimi': 'Cilt Bakımı',
  makyaj: 'Makyaj',
  parfum: 'Parfüm',
  'sac-bakimi': 'Saç Bakımı',
  'gunes-bakimi': 'Güneş Koruyucu',
  'anne-bebek': 'Anne & Bebek',
}

const SYSTEM = `Sen GAMZELİECZANEM eczanesinin akıllı arama motorusun.
Kullanıcı doğal Türkçe ile arama yaptığında sorgudaki ihtiyacı, cilt tipini, sorunu ve hedefi anlayıp en uygun ürünleri bul.
Yalnızca verilen katalogdaki ürün ID'lerini kullan.`

function buildCatalog(urunler) {
  return urunler
    .map((u) =>
      `${u.id}|${u.ad}|${KATEGORI_ADLARI[u.kategori] ?? u.kategori}|${u.altKategori ?? ''}|${u.fiyat}₺|${u.aciklama ?? ''}`
    )
    .join('\n')
}

/**
 * Doğal dil sorgusunu yapay zeka ile analiz edip eşleşen ürünleri döndürür.
 * @param {string} sorgu
 * @returns {Promise<{ aciklama: string, urunler: object[] }>}
 */
export async function aiArama(sorgu) {
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

  const response = await getAnthropicClient().messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].text.trim()
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(cleaned)

  const urunler = (parsed.urunIdleri || [])
    .map((id) => tumUrunler.find((u) => u.id === id))
    .filter(Boolean)

  return { aciklama: parsed.aciklama, urunler }
}

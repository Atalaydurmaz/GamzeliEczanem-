/**
 * Ürün açıklamalarını AI ile yapılandır.
 *
 * POST /api/admin/products/enhance
 *   body: { ids?: number[], overwrite?: boolean, limit?: number }
 *
 * - ids verilmezse tüm aktif ürünleri tarar.
 * - overwrite=false ise (varsayılan) yalnızca boş alanları doldurur.
 * - Her ürün için { ciltTipi, kullanim, rutinOnerisi } üretir ve Supabase'e yazar.
 * - Claude Haiku kullanır (hızlı + ucuz); prompt caching ile katalog sabit tutulur.
 */
import { isAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { getAnthropicClient } from '@/lib/anthropicClient'
import { revalidatePath } from 'next/cache'

const MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 700

const SYSTEM_PROMPT = `Sen GAMZELİECZANEM eczanesi için çalışan bir eczacı kozmetoloğusun.
Görevin, verilen kozmetik ürün bilgisine göre üç kısa ve somut alan üretmek:

1) ciltTipi — "Kimler için uygun": Hangi cilt tipi/saç tipi/kullanıcı profili için uygundur.
   Örn: "Yağlı ve karma ciltler için. Akne ve gözenek sorunu yaşayanlara uygundur.
         Hassas cilt tipleri önce nokta testi yapmalıdır."
2) kullanim — "Nasıl kullanılır": Temiz, adım adım kullanım talimatı.
   Örn: "1. Yüzünüzü temiz ve kuru hale getirin.
         2. Akşam bakımında 2-3 damla uygulayın.
         3. Nemlendiriciyle kapatın.
         4. Gündüz SPF kullanmayı unutmayın."
3) rutinOnerisi — "Rutin önerisi": Bu ürünün rutindeki sırası ve birlikte kullanılabilecek
   ürün KATEGORİLERİ (marka adı verme — temizleyici, tonik, serum, nemlendirici, spf gibi).
   Örn: "Temizleyici jel → tonik → bu serum → hyalüronik asit nemlendirici → SPF 50+ (gündüz).
         Retinol gibi güçlü aktiflerle aynı gece kullanılmamalıdır."

KURALLAR:
- Her alan 2-5 satır, açık ve somut olmalı.
- Tıbbi iddia yapma ("tedavi eder", "iyileştirir" deme). Bunun yerine "destekler", "yardımcı olur" kullan.
- Kategori adı ver, belirli ürün markası önerme.
- Güneş koruyucu önermeyi unutma (gündüz bakımı gerektiren ürünlerde).
- Yalnızca geçerli JSON döndür: {"ciltTipi": "...", "kullanim": "...", "rutinOnerisi": "..."}
- JSON dışında tek karakter yazma, markdown fence kullanma.`

async function enhanceOne(client, urun) {
  const userMessage = `Ürün adı: ${urun.ad}
Kategori: ${urun.kategori}${urun.alt_kategori ? ' / ' + urun.alt_kategori : ''}
Mevcut kısa açıklama: ${urun.aciklama || '(boş)'}
Mevcut detaylı açıklama: ${urun.detay || '(boş)'}

Bu ürün için JSON üret.`

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = resp.content?.find?.(b => b.type === 'text')?.text ?? ''
  // JSON ayıkla — bazen model başına-sonuna boşluk veya ``` koyabilir, temizle.
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Geçerli JSON alınamadı: ' + text.slice(0, 200))
  const parsed = JSON.parse(match[0])

  return {
    ciltTipi:     typeof parsed.ciltTipi     === 'string' ? parsed.ciltTipi.trim()     : null,
    kullanim:     typeof parsed.kullanim     === 'string' ? parsed.kullanim.trim()     : null,
    rutinOnerisi: typeof parsed.rutinOnerisi === 'string' ? parsed.rutinOnerisi.trim() : null,
  }
}

export async function POST(req) {
  if (!await isAdmin()) return Response.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const ids       = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isFinite) : null
  const overwrite = body.overwrite === true
  const limit     = Math.max(1, Math.min(Number(body.limit) || 50, 200))

  // Ürünleri çek
  let q = supabaseAdmin.from('products').select('*')
  if (ids?.length) q = q.in('id', ids)
  else             q = q.eq('aktif', true)
  const { data: products, error } = await q.order('id', { ascending: true }).limit(limit)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // overwrite=false ise zaten dolu olanları atla
  const hedef = overwrite
    ? products
    : products.filter(p => !p.cilt_tipi || !p.kullanim || !p.rutin_onerisi)

  const client = getAnthropicClient()
  const sonuc = { tamam: 0, hata: 0, atlanan: products.length - hedef.length, detay: [] }

  // Sıra ile işle — paralel yaparsak rate limit'e takılırız.
  for (const urun of hedef) {
    try {
      const { ciltTipi, kullanim, rutinOnerisi } = await enhanceOne(client, urun)
      const updates = {}
      if (overwrite || !urun.cilt_tipi)     updates.cilt_tipi     = ciltTipi
      if (overwrite || !urun.kullanim)      updates.kullanim      = kullanim
      if (overwrite || !urun.rutin_onerisi) updates.rutin_onerisi = rutinOnerisi

      if (Object.keys(updates).length) {
        const { error: uErr } = await supabaseAdmin
          .from('products')
          .update(updates)
          .eq('id', urun.id)
        if (uErr) throw uErr
      }

      sonuc.tamam++
      sonuc.detay.push({ id: urun.id, ad: urun.ad, ok: true })
      revalidatePath(`/urunler/${urun.id}`)
    } catch (e) {
      sonuc.hata++
      sonuc.detay.push({ id: urun.id, ad: urun.ad, ok: false, hata: e.message })
    }
  }

  revalidatePath('/urunler')
  return Response.json(sonuc)
}

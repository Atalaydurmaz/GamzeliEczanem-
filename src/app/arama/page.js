import { Suspense } from 'react'
import { aiArama } from '@/lib/aiArama'
import AramaKlient from './AramaKlient'

const BASE_URL = 'https://gamzelidermokozmetik.com'

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ searchParams }) {
  const { q = '' } = await searchParams

  if (!q.trim()) {
    return {
      title: 'Ürün Ara | GAMZELİECZANEM',
      description: 'Yapay zeka destekli akıllı arama ile ihtiyacınıza en uygun dermokozmetik ürünleri bulun. Eczacı güvencesiyle seçilmiş ürünler.',
      alternates: { canonical: `${BASE_URL}/arama` },
    }
  }

  return {
    title: `"${q}" Arama Sonuçları | GAMZELİECZANEM`,
    description: `"${q}" için GAMZELİECZANEM'in yapay zeka destekli eczacı asistanı tarafından önerilen dermokozmetik ürünler.`,
    alternates: { canonical: `${BASE_URL}/arama?q=${encodeURIComponent(q)}` },
    openGraph: {
      title: `"${q}" için Ürün Önerileri`,
      description: `"${q}" aramasına uygun dermokozmetik ürünler. Eczacı güvencesiyle.`,
      url: `${BASE_URL}/arama?q=${encodeURIComponent(q)}`,
    },
  }
}

// ── JSON-LD Structured Data ───────────────────────────────────────────────────

function AramaJsonLd({ sorgu, urunler }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `"${sorgu}" Arama Sonuçları`,
    description: `GAMZELİECZANEM'de "${sorgu}" için önerilen ürünler`,
    numberOfItems: urunler.length,
    itemListElement: urunler.map((u, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: u.ad,
        url: `${BASE_URL}/urunler/${u.id}`,
        image: u.gorsel,
        offers: {
          '@type': 'Offer',
          price: u.fiyat,
          priceCurrency: 'TRY',
          availability: u.stok > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────

export default async function AramaPage({ searchParams }) {
  const { q = '', gorsel } = await searchParams
  const sorgu = q.trim()

  // Sunucuda AI araması yap — Google bu sonuçları HTML'de görecek
  let initialSonuc = null
  if (sorgu && gorsel !== '1') {
    initialSonuc = await aiArama(sorgu).catch((err) => {
      console.error('[AramaPage] aiArama hatası:', err?.message)
      return null
    })
  }

  return (
    <>
      {/* JSON-LD — sonuç varsa yapılandırılmış veri ekle */}
      {initialSonuc?.urunler?.length > 0 && (
        <AramaJsonLd sorgu={sorgu} urunler={initialSonuc.urunler} />
      )}

      {/* SEO için server-render edilmiş ürün listesi (görsel olarak gizli, ekran okuyucular için mevcut) */}
      {initialSonuc?.urunler?.length > 0 && (
        <div className="sr-only" aria-hidden="true">
          <h1>&ldquo;{sorgu}&rdquo; Arama Sonuçları</h1>
          <ul>
            {initialSonuc.urunler.map((u) => (
              <li key={u.id}>
                <a href={`/urunler/${u.id}`}>{u.ad} — {u.fiyat.toLocaleString('tr-TR')} ₺</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* İnteraktif arama arayüzü */}
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl block mb-3 animate-pulse">🔍</span>
              <p className="text-stone-400 text-sm">Yükleniyor...</p>
            </div>
          </div>
        }
      >
        <AramaKlient initialSorgu={sorgu} initialSonuc={initialSonuc} />
      </Suspense>
    </>
  )
}

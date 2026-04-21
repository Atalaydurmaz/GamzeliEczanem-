import Link from 'next/link'
import { notFound } from 'next/navigation'
import { kategoriAdlari, kategoriSayfaYollari } from '@/lib/data'
import { getProductById, getProducts } from '@/lib/products'
import { getStats } from '@/lib/reviews'
import { getEfektifStok } from '@/lib/stock'
import AddToCartButton from '@/components/AddToCartButton'
import ProductCard from '@/components/ProductCard'
import ProductImage from '@/components/ProductImage'
import ReviewSection from '@/components/ReviewSection'
import ShareButtons from '@/components/ShareButtons'

export const revalidate = 60 // ISR: ürün 60 saniyede bir yenilenir

export async function generateStaticParams() {
  const urunler = await getProducts({ aktif: true }).catch(() => [])
  return urunler.map((u) => ({ id: String(u.id) }))
}

const BASE_URL = 'https://gamzelidermokozmetik.com'

export async function generateMetadata({ params }) {
  const { id } = await params
  const urun = await getProductById(id)
  if (!urun) return { title: 'Ürün Bulunamadı' }
  const canonicalUrl = `${BASE_URL}/urunler/${urun.id}`
  return {
    title: urun.ad,
    description: urun.aciklama,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${urun.ad} | GAMZELİECZANEM`,
      description: urun.aciklama,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: urun.gorsel, width: 400, height: 400, alt: urun.ad }],
    },
    twitter: {
      card: 'summary_large_image',
      title: urun.ad,
      description: urun.aciklama,
      images: [urun.gorsel],
    },
  }
}


export default async function UrunDetaySayfasi({ params }) {
  const { id } = await params
  const urun = await getProductById(id)

  if (!urun) notFound()

  const [kategoriUrunler, reviewStats, stok] = await Promise.all([
    getProducts({ kategori: urun.kategori }),
    getStats(),
    getEfektifStok(urun.id),
  ])
  const stats = reviewStats[urun.id]
  const urunPuan = stats ? stats.puan : 0
  const urunYorumSayisi = stats ? stats.yorumSayisi : 0
  const benzerUrunler = kategoriUrunler
    .filter((u) => u.id !== urun.id)
    .slice(0, 4)

  const indirimOrani = urun.eskiFiyat
    ? Math.round(((urun.eskiFiyat - urun.fiyat) / urun.eskiFiyat) * 100)
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: urun.ad,
    description: urun.aciklama,
    image: urun.gorsel,
    sku: String(urun.id),
    brand: { '@type': 'Brand', name: urun.ad.split(' ')[0] },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/urunler/${urun.id}`,
      priceCurrency: 'TRY',
      price: urun.fiyat,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      availability: stok > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'GAMZELİECZANEM' },
    },
    ...(urunYorumSayisi > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: urunPuan,
        reviewCount: urunYorumSayisi,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-stone-400">
          <Link href="/" className="hover:text-rose-500 transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/urunler" className="hover:text-rose-500 transition-colors">Ürünler</Link>
          <span>/</span>
          <Link
            href={kategoriSayfaYollari[urun.kategori] ?? `/urunler?kategori=${urun.kategori}`}
            className="hover:text-rose-500 transition-colors"
          >
            {kategoriAdlari[urun.kategori]}
          </Link>
          <span>/</span>
          <span className="text-stone-600 font-medium line-clamp-1">{urun.ad}</span>
        </nav>
      </div>

      {/* Ürün Detay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Sol: Görsel */}
          <div className="space-y-4">
            <ProductImage
              src={urun.gorsel}
              alt={`${urun.ad} – ${kategoriAdlari[urun.kategori] ?? urun.kategori} | GAMZELİECZANEM`}
              etiket={urun.etiket}
              indirimOrani={indirimOrani}
            />
          </div>

          {/* Sağ: Bilgiler */}
          <div className="sticky top-20">
            {/* Kategori */}
            <Link
              href={kategoriSayfaYollari[urun.kategori] ?? `/urunler?kategori=${urun.kategori}`}
              className="inline-block text-xs font-semibold tracking-widest text-rose-500 uppercase mb-3 hover:text-rose-700 transition-colors"
            >
              {kategoriAdlari[urun.kategori]}
            </Link>

            {/* Başlık */}
            <h1 className="text-3xl font-bold text-stone-900 mb-4 leading-tight">
              {urun.ad}
            </h1>

            {/* Puan */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((yildiz) => (
                  <svg
                    key={yildiz}
                    className={`w-5 h-5 ${yildiz <= Math.round(urunPuan) ? 'text-amber-400' : 'text-stone-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-stone-700">{urunPuan > 0 ? urunPuan : ''}</span>
              <span className="text-sm text-stone-400">({urunYorumSayisi} yorum)</span>
            </div>

            {/* Kısa açıklama */}
            <p className="text-stone-500 leading-relaxed mb-6">{urun.aciklama}</p>

            {/* Fiyat */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-4xl font-bold text-stone-900">
                {urun.fiyat.toLocaleString('tr-TR')} ₺
              </span>
              {urun.eskiFiyat && (
                <>
                  <span className="text-xl text-stone-400 line-through">
                    {urun.eskiFiyat.toLocaleString('tr-TR')} ₺
                  </span>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    %{indirimOrani} tasarruf
                  </span>
                </>
              )}
            </div>

            {/* Sepete Ekle */}
            <div className="mb-6">
              <AddToCartButton urun={urun} />
            </div>

            {/* Avantajlar */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { ikon: '🚚', text: 'Ücretsiz kargo (1.500₺ üzeri)' },
                { ikon: '↩️', text: '30 gün ücretsiz iade' },
                { ikon: '🔒', text: 'Güvenli ödeme' },
                { ikon: '✅', text: 'Orijinal ürün garantisi' },
              ].map((madde) => (
                <div key={madde.text} className="flex items-start gap-2 text-sm text-stone-500">
                  <span className="text-base leading-none mt-0.5">{madde.ikon}</span>
                  <span>{madde.text}</span>
                </div>
              ))}
            </div>

            {/* Paylaş */}
            <div className="border-t border-rose-100 pt-5 pb-1">
              <ShareButtons
                urunAd={urun.ad}
                url={`${BASE_URL}/urunler/${urun.id}`}
              />
            </div>

            {/* Yapılandırılmış kullanım kartları */}
            {(urun.ciltTipi || urun.kullanim || urun.rutinOnerisi) && (
              <div className="border-t border-rose-100 pt-6 space-y-3">
                {urun.ciltTipi && (
                  <div className="flex gap-3 p-4 bg-rose-50/60 border border-rose-100 rounded-xl">
                    <span className="text-xl leading-none shrink-0" aria-hidden>🧴</span>
                    <div>
                      <h3 className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
                        Kimler İçin Uygun
                      </h3>
                      <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{urun.ciltTipi}</p>
                    </div>
                  </div>
                )}
                {urun.kullanim && (
                  <div className="flex gap-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-xl leading-none shrink-0" aria-hidden>⏱️</span>
                    <div>
                      <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                        Nasıl Kullanılır
                      </h3>
                      <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{urun.kullanim}</p>
                    </div>
                  </div>
                )}
                {urun.rutinOnerisi && (
                  <div className="flex gap-3 p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
                    <span className="text-xl leading-none shrink-0" aria-hidden>✨</span>
                    <div>
                      <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                        Rutin Önerisi
                      </h3>
                      <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{urun.rutinOnerisi}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detaylı Açıklama (fallback / ek bilgi) */}
            {urun.detay && (
              <div className="border-t border-rose-100 pt-6">
                <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-3">
                  Ürün Açıklaması
                </h2>
                <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line">{urun.detay}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Müşteri Yorumları */}
      <ReviewSection urunId={urun.id} urunPuan={urunPuan} urunYorumSayisi={urunYorumSayisi} />

      {/* Benzer Ürünler */}
      {benzerUrunler.length > 0 && (
        <section className="bg-rose-50/50 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-stone-900 mb-8">
              Benzer Ürünler
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {benzerUrunler.map((u) => (
                <ProductCard key={u.id} urun={u} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
    </>
  )
}

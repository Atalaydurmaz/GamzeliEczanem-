export const metadata = {
  title: { absolute: 'GAMZELİECZANEM | Eczacı Güvencesiyle Dermokozmetik' },
  description: 'Eczacı güvencesiyle dermokozmetik, makyaj, yüz ve cilt bakımı ürünleri. Türkiye\'nin en kaliteli online eczane kozmetik mağazası.',
  alternates: { canonical: 'https://gamzelidermokozmetik.com' },
  openGraph: {
    title: 'GAMZELİECZANEM | Eczacı Güvencesiyle Dermokozmetik',
    description: 'Eczacı güvencesiyle dermokozmetik, makyaj, yüz ve cilt bakımı ürünleri. Türkiye\'nin en kaliteli online eczane kozmetik mağazası.',
    url: 'https://gamzelidermokozmetik.com',
    type: 'website',
  },
}

import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import HeroSection from '@/components/HeroSection'
import AnimatedCategories from '@/components/AnimatedCategories'
import { getProducts } from '@/lib/products'

export const revalidate = 60 // ISR: ürün listesi 60 saniyede bir yenilenir

export default async function AnaSayfa() {
  const tumUrunler = await getProducts().catch(() => [])
  const onecikarUrunler = tumUrunler.filter(u => u.etiket).slice(0, 6)
  const urunler = tumUrunler

  return (
    <>
      <HeroSection />

      {/* Kategoriler */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Kategoriler</h2>
            <p className="text-stone-400">İhtiyacınıza göre keşfedin</p>
          </div>
          <AnimatedCategories />
        </div>
      </section>

      {/* Yapay Zeka Cilt Analizi Banner */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-8 sm:p-12">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute top-4 right-4 text-6xl opacity-20 select-none hidden sm:block">🔬</div>
            <div className="relative flex flex-col sm:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-5xl shrink-0 shadow-inner">
                🔬
              </div>
              <div className="flex-1 text-center sm:text-left">
                <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold tracking-widest uppercase rounded-full mb-3">
                  Yapay Zeka ile
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  Ücretsiz Yapay Zeka Cilt Analizi
                </h2>
                <p className="text-rose-100 text-sm sm:text-base max-w-lg">
                  5 soruyu cevaplayın, eczacı yapay zekamız cilt tipinizi analiz edip size özel ürünler önersin.
                </p>
              </div>
              <Link
                href="/cilt-analizi"
                className="relative inline-flex items-center justify-center 
    px-12 py-5 
    bg-white text-rose-600 
    font-extrabold text-lg rounded-full 
    transition-all duration-500 ease-in-out
    
    /* Parlama Efekti (Glow) */
    shadow-[0_0_20px_rgba(255,255,255,0.3)]
    
    /* Canlı Animasyonlar */
    hover:scale-110 
    hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]
    hover:text-rose-700
    
    /* Sürekli Hafif Nabız Atışı (Pulse) */
    animate-pulse
    
    /* Tıklama Hissi */
    active:scale-95 
    active:shadow-inner
    
    /* Mühendislik Şıklığı: Kenar Işıltısı */
    border border-white/20
    backdrop-blur-sm"
              >
                Analizi Başlat →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Öne Çıkan Ürünler */}
      <section className="py-16 bg-rose-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 mb-2">Öne Çıkan Ürünler</h2>
              <p className="text-stone-400">En çok tercih edilen ürünlerimiz</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {onecikarUrunler.map((urun, i) => (
              <ProductCard key={urun.id} urun={urun} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Neden GAMZELİMED? */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Neden GAMZELİECZANEM?</h2>
            <p className="text-stone-400 max-w-xl mx-auto">
              Müşterilerimize en iyi alışveriş deneyimini sunmak için çalışıyoruz.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
            {[
              {
                ikon: '🚚',
                baslik: 'Ücretsiz Kargo',
                aciklama: '1.500₺ ve üzeri tüm siparişlerde ücretsiz, hızlı kargo.',
                renk: 'bg-rose-50 border-rose-100',
              },
              {
                ikon: '✅',
                baslik: '%100 Orijinal Ürün',
                aciklama: 'Tüm ürünler yetkili distribütörlerden temin edilir, orijinallik garantisi verilir.',
                renk: 'bg-emerald-50 border-emerald-100',
              },
              {
                ikon: '⚡',
                baslik: 'Hızlı Teslimat',
                aciklama: 'Siparişleriniz 1–3 iş günü içinde kapınıza teslim edilir.',
                renk: 'bg-amber-50 border-amber-100',
              },
              {
                ikon: '🎧',
                baslik: '7/24 Müşteri Desteği',
                aciklama: 'Her zaman yanınızdayız. Telefon, e-posta veya canlı destek ile ulaşın.',
                renk: 'bg-purple-50 border-purple-100',
              },
              {
                ikon: '💊',
                baslik: 'Eczacı Onaylı',
                aciklama: 'Sitemizde yer alan her ürün, eczacımız Gamze Durmaz tarafından bizzat incelenip onaylanmış, %100 orijinal içeriklidir.',
                renk: 'bg-sky-50 border-sky-100',
              },
            ].map((ozellik) => (
              <div key={ozellik.baslik} className={`${ozellik.renk} border rounded-2xl p-6 text-center`}>
                <div className="text-4xl mb-4">{ozellik.ikon}</div>
                <h3 className="text-base font-bold text-stone-800 mb-2">{ozellik.baslik}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{ozellik.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kampanya Banner */}
      <section className="py-16 bg-rose-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 to-pink-600 p-12 text-white text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <p className="text-rose-100 text-sm font-semibold tracking-widest uppercase mb-3">Özel Teklif</p>
              <h2 className="text-4xl font-bold mb-4">İlk Siparişinizde %20 İndirim</h2>
              <p className="text-rose-100 mb-8 max-w-md mx-auto">
                Hemen alışveriş yapın, özel indirim avantajından yararlanın.
              </p>
              <Link href="/makyaj" className="relative inline-flex items-center justify-center 
    px-12 py-5 
    bg-white text-rose-600 
    font-extrabold text-lg rounded-full 
    transition-all duration-500 ease-in-out
    
    /* Parlama Efekti (Glow) */
    shadow-[0_0_20px_rgba(255,255,255,0.3)]
    
    /* Canlı Animasyonlar */
    hover:scale-110 
    hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]
    hover:text-rose-700
    
    /* Sürekli Hafif Nabız Atışı (Pulse) */
    animate-pulse
    
    /* Tıklama Hissi */
    active:scale-95 
    active:shadow-inner
    
    /* Mühendislik Şıklığı: Kenar Işıltısı */
    border border-white/20
    backdrop-blur-sm">
                Alışverişe Başla
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Son Eklenen Ürünler */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl font-bold text-stone-900">Tüm Koleksiyon</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {urunler.slice(0, 8).map((urun, i) => (
              <ProductCard key={urun.id} urun={urun} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

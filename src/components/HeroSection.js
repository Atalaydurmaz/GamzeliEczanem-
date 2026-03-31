'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const SLIDES = [
  // First slide — Yeni Cilt Serumu Serisi promo
  {
    src: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&h=900&fit=crop&q=80',
    alt: 'Yeni Cilt Serumu Serisi',
    baslik: 'Yeni Cilt\nSerumu\nSerisi',
    ctaText: 'İncele',
    ctaHref: '/cilt-bakimi',
  },
  // Lazartigue Nourish Shampoo
  { src: 'https://us.lazartigue.com/cdn/shop/products/SHAMP-NOURISH-250ML-0919_grande.png?v=1586436154', alt: 'Lazartigue Nourish Şampuan' },
  // Close-up smooth skin texture
  { src: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&h=900&fit=crop&q=80', alt: 'Pürüzsüz Cilt' },
  // Woman applying face moisturizer / cream
  { src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=900&fit=crop&q=80', alt: 'Nemlendirici Uygulama' },
  // Fifth slide — Güneş Koruyucu promo
  {
    src: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=1200&h=900&fit=crop&q=80',
    alt: 'Güneş Koruyucu Serisi',
    baslik: 'Güneş\nKoruyucu\nSerisi',
    ctaText: 'İncele',
    ctaHref: '/gunes-koruyucu',
  },
  // Sixth slide — Anne & Bebek promo
  {
    src: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200&h=900&fit=crop&q=80',
    alt: 'Anne & Bebek Bakımı',
    baslik: 'Anne &\nBebek\nBakımı',
    ctaText: 'Keşfet',
    ctaHref: '/anne-bebek',
  },
  // Last slide — Yeni Makyaj Koleksiyonu promo
  {
    src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=900&fit=crop&q=80',
    alt: 'Yeni Makyaj Koleksiyonu',
    baslik: 'Yeni Makyaj\nKoleksiyonu',
    ctaText: 'Keşfet',
    ctaHref: '/makyaj',
  },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
})

export default function HeroSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(prev => (prev + 1) % SLIDES.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-stone-50 min-h-screen flex items-center">
      {/* Background blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* ── Left: text ── */}
          <div>
            <motion.span
              {...fadeUp(0.1)}
              className="inline-block px-4 py-1.5 bg-rose-100 text-rose-600 text-xs font-semibold tracking-widest uppercase rounded-full mb-6"
            >
              Yeni Koleksiyon 2026
            </motion.span>

            <motion.h1
              {...fadeUp(0.25)}
              className="text-5xl sm:text-6xl font-bold text-stone-900 leading-tight mb-3"
            >
              GAMZELİECZANEM
            </motion.h1>

            <motion.p
              {...fadeUp(0.4)}
              className="text-3xl font-light text-rose-500 mb-6 tracking-wide"
            >
              Eczacı Güvencesiyle Sağlıklı Güzellik
            </motion.p>

            <motion.p
              {...fadeUp(0.5)}
              className="text-lg text-stone-500 leading-relaxed mb-8 max-w-lg"
            >
              En seçkin makyaj, yüz, cilt ve saç bakımı ürünleri ile güzelliğinizi
              keşfedin. Kalite ve lüksün buluşma noktası.
            </motion.p>

            <motion.div {...fadeUp(0.6)} className="flex flex-wrap gap-4">
              <Link
                href="/makyaj"
                className="px-8 py-3.5 border-2 border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-all flex items-center gap-2"
              >
                Makyaj Koleksiyonu
              </Link>
              <Link
                href="/cilt-bakimi"
                className="px-8 py-3.5 border-2 border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-all flex items-center gap-2"
              >
                <span>Cilt Bakımını Keşfet</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.72)} className="mt-10 pt-8 border-t border-rose-100">
              {/* Pulse-glow CTA */}
              <motion.div
                className="inline-block rounded-full"
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(244,63,94,0.5)',
                    '0 0 0 14px rgba(244,63,94,0)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              >
                <Link
                  href="/cilt-analizi"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-base rounded-full hover:from-rose-600 hover:to-pink-600 transition-all hover:shadow-xl active:scale-95"
                >
                  <span className="text-xl">🔬</span>
                  <span>Cilt Analizini Başlat</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
              <p className="text-xs text-stone-400 mt-3">
                5 soruda kişisel cilt analizi — ücretsiz
              </p>
            </motion.div>
          </div>

          {/* ── Right: floating carousel ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="relative h-[580px] rounded-3xl overflow-hidden shadow-2xl"
            >
              {SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                  style={{ opacity: i === current ? 1 : 0 }}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(max-width: 1280px) 50vw, 600px"
                    className={`object-cover ${i === current ? 'hero-zoom' : ''}`}
                    priority={i === 0}
                  />
                  {slide.baslik && (
                    <div className="absolute inset-0 bg-black/25 flex items-center px-8">
                      <div>
                        <p className="text-white/80 text-xs font-semibold tracking-widest uppercase mb-2">
                          Yeni Koleksiyon
                        </p>
                        <h3 className="text-white text-2xl font-black leading-tight mb-4 whitespace-pre-line">
                          {slide.baslik}
                        </h3>
                        <Link
                          href={slide.ctaHref}
                          className="inline-block px-5 py-2 bg-white text-stone-800 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-rose-50 transition-colors"
                        >
                          {slide.ctaText}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

              {/* dot indicators */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? 'bg-white w-6' : 'bg-white/50 w-2'
                    }`}
                    aria-label={`Slayt ${i + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

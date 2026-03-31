'use client'

import { motion } from 'framer-motion'

const CHIPS = [
  { icon: '✨', label: 'Kişisel Rutin' },
  { icon: '🧴', label: 'Ürün Önerisi' },
  { icon: '🔬', label: 'Cilt Analizi' },
  { icon: '💬', label: '7/24 Destek' },
]

export default function ChatBotPromoCard() {
  function handleOpen() {
    window.dispatchEvent(new CustomEvent('openChatBot'))
  }

  return (
    <section className="py-20 relative overflow-hidden bg-[#0a0010]">

      {/* ── Deep neon ambient orbs ── */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-rose-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Glassmorphism card with neon border glow ── */}
          <div
            className="relative rounded-3xl p-[1px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.6) 0%, rgba(168,85,247,0.4) 50%, rgba(244,63,94,0.2) 100%)',
              boxShadow: '0 0 60px rgba(244,63,94,0.25), 0 0 120px rgba(168,85,247,0.15)',
            }}
          >
            <div className="relative bg-[#0d0015]/80 backdrop-blur-2xl rounded-3xl px-8 py-12 sm:px-14 sm:py-16 text-white text-center overflow-hidden">

              {/* Inner glow layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-purple-500/5 rounded-3xl pointer-events-none" />

              {/* ── Live badge ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-bold tracking-widest uppercase mb-8"
              >
                <motion.span
                  className="w-2 h-2 bg-rose-400 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                />
                Yapay Zeka Destekli · Ücretsiz
              </motion.div>

              {/* ── Title ── */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-6xl font-black mb-5 leading-tight tracking-tight"
              >
                Kişisel{' '}
                <span
                  style={{
                    background: 'linear-gradient(90deg, #fb7185, #e879f9, #fb7185)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Güzellik
                </span>
                <br />
                Yapay Zekanız
              </motion.h2>

              {/* ── Description ── */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.42, duration: 0.7 }}
                className="text-white/60 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
              >
                Cilt tipinizi analiz eder, size özel bakım rutini oluşturur ve en uygun ürünleri saniyeler içinde önerir.
                Eczacı bilgisiyle güçlendirilmiş yapay zeka asistanınız her an yanınızda.
              </motion.p>

              {/* ── Feature chips ── */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.55, duration: 0.6 }}
                className="flex flex-wrap justify-center gap-3 mb-12"
              >
                {CHIPS.map(({ icon, label }, i) => (
                  <motion.span
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.55 + i * 0.07 }}
                    whileHover={{ scale: 1.08, borderColor: 'rgba(244,63,94,0.7)' }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/80 border border-white/10 bg-white/5 cursor-default"
                  >
                    <span>{icon}</span>
                    {label}
                  </motion.span>
                ))}
              </motion.div>

              {/* ── Neon CTA button ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.65, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-3"
              >
                <motion.button
                  onClick={handleOpen}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(244,63,94,0.5), 0 0 40px rgba(244,63,94,0.2)',
                      '0 0 35px rgba(244,63,94,0.8), 0 0 70px rgba(244,63,94,0.35)',
                      '0 0 20px rgba(244,63,94,0.5), 0 0 40px rgba(244,63,94,0.2)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base text-white"
                  style={{
                    background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #a855f7 100%)',
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, 15, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="text-xl"
                  >
                    💬
                  </motion.span>
                  <span>Güzellik Rutinini Keşfet</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>

                <p className="text-white/25 text-xs">Ücretsiz · Kayıt gerekmez · Sonuç 10 saniyede</p>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

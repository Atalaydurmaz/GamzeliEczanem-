'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const KATEGORILER = [
  { href: '/makyaj',          ikon: '💄', ad: 'Makyaj',           renk: 'from-rose-50 to-pink-100' },
  { href: '/yuz-bakimi',      ikon: '🧖‍♀️', ad: 'Yüz Bakımı',       renk: 'from-purple-50 to-indigo-100' },
  { href: '/gunes-koruyucu',  ikon: '☀️', ad: 'Güneş Koruyucu',  renk: 'from-orange-50 to-amber-100' },
  { href: '/cilt-bakimi',     ikon: '✨', ad: 'Cilt Bakımı',      renk: 'from-amber-50 to-rose-100' },
  { href: '/sac-bakimi',      ikon: '💇', ad: 'Saç Bakımı',       renk: 'from-emerald-50 to-teal-100' },
]

export default function AnimatedCategories() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {KATEGORILER.map((kat, i) => (
        <motion.div
          key={kat.href}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
        >
          <motion.div
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          >
            <Link
              href={kat.href}
              className={`group relative overflow-hidden flex flex-col items-center rounded-2xl bg-gradient-to-br ${kat.renk} border border-rose-100 p-6 text-center hover:shadow-lg transition-shadow duration-300`}
            >
              <motion.div
                className="text-4xl mb-3"
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.15 }}
                transition={{ duration: 0.45 }}
              >
                {kat.ikon}
              </motion.div>
              <h3 className="text-base font-bold text-stone-800 group-hover:text-rose-600 transition-colors mb-1">
                {kat.ad}
              </h3>
              <span className="text-xs text-rose-400 font-medium">Keşfet →</span>
            </Link>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '@/context/CartContext'
import { useStock } from '@/context/StockContext'

export default function CartDrawer() {
  const {
    sepet,
    toplamAdet,
    toplamFiyat,
    kargoUcreti,
    adediGuncelle,
    sepettenCikar,
    drawerAcik,
    drawerKapat,
  } = useCart()
  const { getUrunStok, decrementLocalStok, incrementLocalStok } = useStock()

  function adetArttir(item) {
    const kalanStok = getUrunStok(item.id)
    if (kalanStok !== null && kalanStok <= 0) return
    adediGuncelle(item.id, item.adet + 1)
    decrementLocalStok(item.id, 1)
  }

  function adetAzalt(item) {
    if (item.adet <= 1) {
      sepettenCikar(item.id)
      incrementLocalStok(item.id, item.adet)
      return
    }
    adediGuncelle(item.id, item.adet - 1)
    incrementLocalStok(item.id, 1)
  }

  // Escape tuşu ile kapat
  useEffect(() => {
    if (!drawerAcik) return
    function onKey(e) {
      if (e.key === 'Escape') drawerKapat()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerAcik, drawerKapat])

  // Body scroll lock
  useEffect(() => {
    if (!drawerAcik) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerAcik])

  const genelToplam = Math.round((toplamFiyat + kargoUcreti) * 100) / 100

  return (
    <AnimatePresence>
      {drawerAcik && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-drawer-backdrop"
            data-testid="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={drawerKapat}
            className="fixed inset-0 bg-stone-900/40 z-[60]"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="cart-drawer-panel"
            data-testid="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Sepetim"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] max-w-full bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100">
              <h2 className="text-lg font-bold text-stone-900">
                Sepetim{' '}
                <span className="text-sm font-normal text-stone-400">
                  ({toplamAdet} ürün)
                </span>
              </h2>
              <button
                onClick={drawerKapat}
                aria-label="Sepeti kapat"
                className="w-10 h-10 flex items-center justify-center rounded-full text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {sepet.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-stone-500 text-sm">Sepetiniz boş</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {sepet.map((item) => {
                    // Kalan stok: sepete ekleme anında decrementLocalStok ile azaldı.
                    // Yani getUrunStok = eklenebilecek ilave adet. `+` bu değer <= 0 ise disabled.
                    const kalanStok = getUrunStok(item.id)
                    const maxUlasildi = kalanStok !== null && kalanStok <= 0
                    return (
                    <li
                      key={item.id}
                      data-testid="cart-drawer-item"
                      className="flex gap-3 bg-rose-50/40 rounded-xl p-3"
                    >
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white">
                        <Image
                          src={item.gorsel}
                          alt={item.ad}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-stone-800 line-clamp-2">
                          {item.ad}
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 border border-rose-200 rounded-full bg-white">
                            <button
                              onClick={() => adetAzalt(item)}
                              aria-label="Adet azalt"
                              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-rose-600 transition-colors"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-stone-800">
                              {item.adet}
                            </span>
                            <button
                              onClick={() => adetArttir(item)}
                              disabled={maxUlasildi}
                              aria-label="Adet arttır"
                              title={maxUlasildi ? 'Stoktaki son ürüne ulaşıldı' : undefined}
                              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-rose-600 transition-colors disabled:text-stone-300 disabled:cursor-not-allowed disabled:hover:text-stone-300"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-bold text-stone-900">
                            {(item.fiyat * item.adet).toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          sepettenCikar(item.id)
                          incrementLocalStok(item.id, item.adet)
                        }}
                        aria-label="Ürünü kaldır"
                        className="self-start w-8 h-8 flex items-center justify-center text-rose-200 hover:text-rose-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {sepet.length > 0 && (
              <div className="border-t border-rose-100 px-5 py-4 space-y-3 bg-white">
                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span>Ara Toplam</span>
                  <span className="font-medium">{toplamFiyat.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex items-center justify-between text-sm text-stone-600">
                  <span>Kargo</span>
                  <span className="font-medium">
                    {kargoUcreti === 0 ? 'Ücretsiz' : `${kargoUcreti.toLocaleString('tr-TR')} ₺`}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-rose-100">
                  <span className="text-sm font-semibold text-stone-700">Toplam</span>
                  <span
                    data-testid="cart-drawer-total"
                    className="text-lg font-bold text-stone-900"
                  >
                    {genelToplam.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
                <Link
                  href="/odeme"
                  onClick={drawerKapat}
                  data-testid="cart-drawer-checkout"
                  className="block w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-full text-center text-sm transition-colors"
                >
                  Ödemeye Geç
                </Link>
                <Link
                  href="/sepet"
                  onClick={drawerKapat}
                  className="block w-full py-2.5 px-4 border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold rounded-full text-center text-sm transition-colors"
                >
                  Sepeti Görüntüle
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

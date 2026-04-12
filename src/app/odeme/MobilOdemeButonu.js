'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Mobilde klavye açıldığında ekranın altında kaybolan submit butonunu
 * VisualViewport API kullanarak her zaman klavyenin üzerinde tutar.
 *
 * - iOS Safari: layoutViewport sabit kalır, visualViewport küçülür →
 *   barı `window.innerHeight - visualViewport.height` kadar yukarı kaydırırız.
 * - Android Chrome: viewport zaten yeniden boyutlandırılır,
 *   fixed bottom:0 doğal olarak klavyenin üzerinde kalır.
 * - Masaüstü (lg+): hiç render edilmez.
 */
export default function MobilOdemeButonu({ yukleniyor, genelToplam, zamanAsimi, onZamanAsimiReset }) {
  const barRef = useRef(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function guncelle() {
      if (!barRef.current) return
      // Klavye yüksekliği = layout viewport - visual viewport offsetTop - visual viewport height
      const klavyeYuksekligi = Math.max(
        0,
        window.innerHeight - vv.offsetTop - vv.height
      )
      // env(safe-area-inset-bottom) tarayıcı tarafından CSS'de eklenir; JS'de 0 kullanıyoruz
      barRef.current.style.transform = `translateY(-${klavyeYuksekligi}px)`
    }

    vv.addEventListener('resize', guncelle)
    vv.addEventListener('scroll', guncelle)
    guncelle()

    return () => {
      vv.removeEventListener('resize', guncelle)
      vv.removeEventListener('scroll', guncelle)
    }
  }, [])

  if (hidden) return null

  return (
    <div
      ref={barRef}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-100 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="px-4 py-3">
        {zamanAsimi ? (
          <button
            type="button"
            onClick={onZamanAsimiReset}
            className="w-full py-3.5 rounded-full font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors text-sm"
          >
            Tekrar Dene
          </button>
        ) : (
          <button
            type="submit"
            form="odeme-form"
            disabled={yukleniyor}
            className={`w-full py-3.5 rounded-full font-bold text-white text-sm transition-all ${
              yukleniyor
                ? 'bg-stone-300 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-600 active:scale-95'
            }`}
          >
            {yukleniyor ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                İşleniyor...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Siparişi Tamamla — {genelToplam.toLocaleString('tr-TR')} ₺
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function BasariliIcerik() {
  const params = useSearchParams()
  const siparisNo = params.get('siparis') || ('GM' + Date.now().toString().slice(-8))

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Başarı ikonu */}
        <div className="flex items-center justify-center w-24 h-24 bg-emerald-100 rounded-full mx-auto mb-6">
          <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-stone-900 mb-3">Siparişiniz Alındı!</h1>
        <p className="text-stone-500 mb-6 leading-relaxed">
          Siparişiniz başarıyla oluşturuldu. Onay e-postası adresinize gönderildi.
          Kargonuz 1–3 iş günü içinde kapınıza teslim edilecektir.
        </p>

        {/* Sipariş numarası */}
        <div className="bg-white border border-rose-100 rounded-2xl px-6 py-4 mb-8 shadow-sm">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Sipariş Numarası</p>
          <p className="text-2xl font-bold text-rose-600 tracking-widest">{siparisNo}</p>
        </div>

        {/* Bilgi kutuları */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { ikon: '📦', baslik: 'Hazırlanıyor', aciklama: 'Siparişiniz hazırlanıyor' },
            { ikon: '🚚', baslik: 'Kargoya Verildi', aciklama: '1–3 iş günü' },
            { ikon: '🏠', baslik: 'Teslim', aciklama: 'Adresinize teslim' },
          ].map((adim, i) => (
            <div key={i} className="bg-white border border-rose-100 rounded-xl p-3 shadow-sm">
              <div className="text-2xl mb-1">{adim.ikon}</div>
              <p className="text-xs font-semibold text-stone-700">{adim.baslik}</p>
              <p className="text-xs text-stone-400">{adim.aciklama}</p>
            </div>
          ))}
        </div>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-8 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-full transition-all hover:shadow-lg hover:shadow-rose-200"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/urunler"
            className="px-8 py-3.5 border-2 border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-all"
          >
            Alışverişe Devam Et
          </Link>
        </div>

        <p className="mt-8 text-xs text-stone-400">
          Sorularınız için{' '}
          <a href="mailto:destek@gamzelieczanem.com" className="text-rose-500 hover:underline">
            destek@gamzelieczanem.com
          </a>{' '}
          adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  )
}

export default function BasariliSayfasi() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full" /></div>}>
      <BasariliIcerik />
    </Suspense>
  )
}

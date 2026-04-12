'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ProductImage({ src, alt, etiket, indirimOrani }) {
  const [hata, setHata] = useState(false)

  return (
    <div className="relative aspect-square rounded-3xl overflow-hidden bg-rose-50 shadow-lg">
      {hata ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-rose-200">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-rose-300">Görsel yüklenemedi</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          onError={() => setHata(true)}
        />
      )}
      {etiket && (
        <span className="absolute top-4 left-4 px-3 py-1.5 bg-rose-500 text-white text-sm font-bold rounded-full">
          {etiket}
        </span>
      )}
      {indirimOrani && (
        <span className="absolute top-4 right-4 px-3 py-1.5 bg-emerald-500 text-white text-sm font-bold rounded-full">
          %{indirimOrani} İndirim
        </span>
      )}
    </div>
  )
}

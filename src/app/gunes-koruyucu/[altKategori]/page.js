'use client'

import { use } from 'react'
import AltKategoriSayfasi from '@/components/AltKategoriSayfasi'

export default function Sayfa({ params }) {
  const { altKategori } = use(params)
  return (
    <AltKategoriSayfasi
      anaKategoriId="gunes-bakimi"
      altKategoriSlug={altKategori}
      apiKategori="gunes-bakimi"
    />
  )
}

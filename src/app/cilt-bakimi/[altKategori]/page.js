'use client'

import { use } from 'react'
import AltKategoriSayfasi from '@/components/AltKategoriSayfasi'

export default function Sayfa({ params }) {
  const { altKategori } = use(params)
  return (
    <AltKategoriSayfasi
      anaKategoriId="cilt-bakimi"
      altKategoriSlug={altKategori}
      apiKategori="cilt-bakimi"
    />
  )
}

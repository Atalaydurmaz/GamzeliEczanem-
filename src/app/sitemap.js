import { getProducts } from '@/lib/products'

const BASE_URL = 'https://gamzelieczanem.com'

export default async function sitemap() {
  const urunler = await getProducts().catch(() => [])
  const kategoriler = [
    { yol: '/makyaj', priority: 0.9, changeFrequency: 'weekly' },
    { yol: '/cilt-bakimi', priority: 0.9, changeFrequency: 'weekly' },
    { yol: '/yuz-bakimi', priority: 0.9, changeFrequency: 'weekly' },
    { yol: '/sac-bakimi', priority: 0.9, changeFrequency: 'weekly' },
    { yol: '/gunes-koruyucu', priority: 0.9, changeFrequency: 'weekly' },
    { yol: '/anne-bebek', priority: 0.8, changeFrequency: 'weekly' },
    { yol: '/agiz-bakimi', priority: 0.7, changeFrequency: 'weekly' },
  ]

  const statikSayfalar = [
    { yol: '/hakkimizda', priority: 0.6, changeFrequency: 'monthly' },
    { yol: '/iletisim', priority: 0.6, changeFrequency: 'monthly' },
    { yol: '/sss', priority: 0.5, changeFrequency: 'monthly' },
    { yol: '/kargo-teslimat', priority: 0.4, changeFrequency: 'monthly' },
    { yol: '/iade-politikasi', priority: 0.4, changeFrequency: 'monthly' },
    { yol: '/gizlilik-politikasi', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const urunSayfalar = urunler.map((u) => ({
    url: `${BASE_URL}/urunler/${u.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...kategoriler.map(({ yol, priority, changeFrequency }) => ({
      url: `${BASE_URL}${yol}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })),
    ...statikSayfalar.map(({ yol, priority, changeFrequency }) => ({
      url: `${BASE_URL}${yol}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })),
    ...urunSayfalar,
  ]
}

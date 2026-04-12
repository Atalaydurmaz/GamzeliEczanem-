import Link from 'next/link'
import kategoriler from '@/data/categories'

export const metadata = {
  title: 'Ağız Bakımı – GAMZELİECZANEM',
  description: 'Diş fırçası, macun, gargara ve diş beyazlatma ürünleri.',
}

const kategori = kategoriler.find((k) => k.id === 'agiz-bakimi')

export default function AgizBakimi() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-rose-50 border-b border-rose-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{kategori.ikon}</span>
            <h1 className="text-4xl font-bold text-stone-900">{kategori.label}</h1>
          </div>
          <p className="text-stone-500">Sağlıklı ve parlak gülüşler için uzman ürünler</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Yakında banner — en üstte */}
        <div className="mb-10 text-center py-10 bg-rose-50 rounded-3xl border border-rose-100">
          <p className="text-5xl mb-3">🚀</p>
          <h3 className="text-xl font-bold text-stone-800 mb-2">Ürünler Yakında Eklenecek</h3>
          <p className="text-stone-500 text-sm mb-5">Bu kategorideki ürünlerimiz çok yakında burada olacak.</p>
          <Link href="/iletisim"
            className="inline-block px-6 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-full hover:bg-rose-700 transition-colors">
            Bilgi Al
          </Link>
        </div>

        {/* Alt kategoriler — sadece görsel, tıklanamaz */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {kategori.altKategoriler.map((alt) => (
            <div key={alt.id}
              className="bg-white border border-stone-100 rounded-2xl p-6 opacity-60 cursor-not-allowed select-none">
              <h2 className="text-base font-bold text-stone-500 mb-3">{alt.label}</h2>
              <ul className="space-y-1.5">
                {alt.urunler.map((u) => (
                  <li key={u.href} className="text-sm text-stone-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                    {u.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

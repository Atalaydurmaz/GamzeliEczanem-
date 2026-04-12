import Link from 'next/link'

const ONERILENKATEGORILER = [
  { ikon: '💄', label: 'Makyaj', href: '/makyaj' },
  { ikon: '✨', label: 'Cilt Bakımı', href: '/cilt-bakimi' },
  { ikon: '🌸', label: 'Yüz Bakımı', href: '/yuz-bakimi' },
  { ikon: '💆', label: 'Saç Bakımı', href: '/sac-bakimi' },
  { ikon: '☀️', label: 'Güneş Koruyucu', href: '/gunes-koruyucu' },
  { ikon: '👶', label: 'Anne & Bebek', href: '/anne-bebek' },
]

export default function NotFound() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">

        {/* İllüstrasyon */}
        <div className="relative mb-8">
          <div className="text-8xl select-none">🔍</div>
          <div className="absolute -top-2 -right-4 text-3xl animate-bounce select-none">💄</div>
          <div className="absolute -bottom-2 -left-4 text-2xl animate-pulse select-none">✨</div>
        </div>

        {/* Başlık */}
        <h1 className="text-6xl font-black text-stone-900 mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-stone-700 mb-3">
          Aradığınız sayfa bulunamadı
        </h2>
        <p className="text-stone-500 max-w-md leading-relaxed mb-8">
          Bu ürün kaldırılmış, bağlantı değişmiş ya da hiç var olmamış olabilir.
          Ama güzel şeyler hâlâ burada — bakalım birlikte!
        </p>

        {/* CTA butonları */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <Link
            href="/"
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-full transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/urunler"
            className="px-6 py-3 border border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-colors"
          >
            Tüm Ürünleri Gör
          </Link>
        </div>

        {/* Kategori önerileri */}
        <div className="w-full max-w-lg">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
            Belki bunlara bakmak ister misiniz?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {ONERILENKATEGORILER.map((kat) => (
              <Link
                key={kat.href}
                href={kat.href}
                className="flex flex-col items-center gap-1.5 p-4 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-2xl transition-colors group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{kat.ikon}</span>
                <span className="text-xs font-semibold text-stone-700">{kat.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Yardım linki */}
        <p className="mt-10 text-sm text-stone-400">
          Sorun devam ediyorsa{' '}
          <Link href="/iletisim" className="text-rose-500 hover:underline font-medium">
            bizimle iletişime geçin
          </Link>
        </p>

      </div>
    </div>
  )
}

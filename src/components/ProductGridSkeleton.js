// Kategori sayfalarında ürünler fetch edilirken gösterilen iskelet grid.
// "Ürün bulunamadı" boş-state'inin yanlışlıkla yükleme sırasında flash
// etmesini engeller — yerine animate-pulse'lu placeholder kartlar görünür.
export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-rose-100 bg-white overflow-hidden">
          <div className="aspect-square bg-rose-50/60 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-3/4 bg-rose-50 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-rose-50 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-rose-100 rounded animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" />
        <p className="text-sm text-stone-400">Yükleniyor...</p>
      </div>
    </div>
  )
}

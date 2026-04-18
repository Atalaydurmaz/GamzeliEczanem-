export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <span className="text-3xl animate-spin inline-block" style={{ animationDuration: '2s' }}>✨</span>
        </div>
        <p className="text-stone-700 font-semibold mb-1">Yapay zeka analiz ediyor...</p>
        <p className="text-stone-400 text-sm">Size en uygun ürünler hazırlanıyor</p>
      </div>
    </div>
  )
}

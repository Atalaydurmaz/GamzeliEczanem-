import Link from 'next/link'

export const metadata = {
  title: 'Kargo & Teslimat – GAMZELİECZANEM',
  description: 'Kargo ve teslimat koşulları, ücretsiz kargo sınırı ve teslimat süreleri hakkında bilgi alın.',
}

const BOLUMLER = [
  {
    ikon: '🚚',
    baslik: 'Kargo Ücretleri',
    icerik: [
      { soru: 'Ücretsiz Kargo', cevap: '1.500₺ ve üzeri siparişlerde kargo tamamen ücretsizdir.' },
      { soru: 'Standart Kargo', cevap: '1.500₺ altındaki siparişler için kargo ücreti 130₺\'dir.' },
    ],
  },
  {
    ikon: '📦',
    baslik: 'Kargo Firmaları',
    icerik: [
      { soru: 'Anlaşmalı Firmalar', cevap: 'Trendyol Express ve Yurtiçi Kargo ile çalışmaktayız. Sipariş durumunuza göre hangisiyle gönderileceği bildirilir.' },
      { soru: 'Kargo Takibi', cevap: 'Sipariş kargoya verildikten sonra takip numarası e-posta ve telefon numaranıza gönderilir.' },
    ],
  },
  {
    ikon: '📅',
    baslik: 'Teslimat Süreleri',
    icerik: [
      { soru: 'Kargoya Verilme', cevap: 'Siparişler onaylandıktan sonra 1–3 iş günü içinde kargoya verilir.' },
      { soru: 'Teslimat Süresi', cevap: 'Kargo teslim süresi şehirlerarası için 1–2 iş günüdür. Toplam süre genellikle 2–5 iş günüdür.' },
      { soru: 'Çalışma Günleri', cevap: 'Siparişler hafta içi (Pazartesi–Cuma) işleme alınır. Hafta sonu verilen siparişler Pazartesi günü işleme alınır.' },
    ],
  },
  {
    ikon: '📍',
    baslik: 'Teslimat Adresi',
    icerik: [
      { soru: 'Adres Değişikliği', cevap: 'Sipariş kargoya verilmeden önce adres değişikliği için müşteri hizmetlerimizi arayabilirsiniz.' },
      { soru: 'Kapıda Teslim', cevap: 'Kargo görevlisi tarafından belirtilen adrese teslim edilir. Teslim alınamazsa şube veya kilit noktasına bırakılabilir.' },
    ],
  },
]

export default function KargoTeslimatPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-4xl block mb-4">🚚</span>
          <h1 className="text-4xl font-bold text-stone-900 mb-3">Kargo & Teslimat</h1>
          <p className="text-stone-500">Siparişlerinizin size ulaşma süreci hakkında tüm detaylar.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Özet Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { ikon: '✅', baslik: '1.500₺ Üzeri', alt: 'Ücretsiz kargo' },
            { ikon: '⚡', baslik: '2–5 İş Günü', alt: 'Teslimat süresi' },
            { ikon: '📍', baslik: 'Kapıya Teslim', alt: 'Trendyol Express & Yurtiçi' },
          ].map((k) => (
            <div key={k.baslik} className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center">
              <span className="text-3xl block mb-2">{k.ikon}</span>
              <p className="text-sm font-bold text-stone-800">{k.baslik}</p>
              <p className="text-xs text-stone-400 mt-0.5">{k.alt}</p>
            </div>
          ))}
        </div>

        {/* Detay Bölümleri */}
        {BOLUMLER.map((bolum) => (
          <div key={bolum.baslik} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 bg-stone-50 border-b border-stone-100">
              <span className="text-xl">{bolum.ikon}</span>
              <h2 className="text-base font-bold text-stone-800">{bolum.baslik}</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {bolum.icerik.map((madde) => (
                <div key={madde.soru} className="px-6 py-4">
                  <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-1">{madde.soru}</p>
                  <p className="text-sm text-stone-600 leading-relaxed">{madde.cevap}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Yardım */}
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
          <p className="text-stone-700 font-semibold mb-2">Kargo ile ilgili sorunuz mu var?</p>
          <p className="text-stone-500 text-sm mb-4">Müşteri hizmetlerimiz size yardımcı olmaktan memnuniyet duyar.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="tel:02624126928" className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-full transition-colors">
              📞 0262 412 6928
            </a>
            <Link href="/iletisim" className="px-5 py-2.5 border border-rose-200 text-rose-600 text-sm font-medium rounded-full hover:bg-rose-50 transition-colors">
              ✉️ Mesaj Gönder
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

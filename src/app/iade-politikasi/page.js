import Link from 'next/link'

export const metadata = {
  title: 'İade Politikası – GAMZELİECZANEM',
  description: 'GAMZELİECZANEM iade ve değişim koşulları hakkında bilgi alın.',
}

const BOLUMLER = [
  {
    ikon: '✅',
    baslik: 'İade Hakkı',
    icerik: [
      { soru: 'İade Süresi', cevap: 'Teslim tarihinden itibaren 30 gün içinde iade talebinde bulunabilirsiniz.' },
      { soru: 'İade Koşulları', cevap: 'Ürünün orijinal ambalajında, kullanılmamış, açılmamış ve eksiksiz olması gerekmektedir. Ambalajı açılmış kozmetik ürünler hijyen nedeniyle iade kabul edilmez. Ürünle birlikte gelen tüm aksesuarlar ve fatura iade paketine eklenmelidir.' },
    ],
  },
  {
    ikon: '🚫',
    baslik: 'İade Edilemeyen Ürünler',
    icerik: [
      { soru: 'Hijyen Ürünler', cevap: 'Sağlık ve hijyen nedeniyle açılmış veya kullanılmış kozmetik ürünler (ruj, fondöten, maskara vb.) iade edilememektedir.' },
      { soru: 'İstisnalar', cevap: 'Ürün hasarlı, bozuk veya yanlış geldiği durumlarda kullanılmış olsa dahi iade kabul edilir.' },
    ],
  },
  {
    ikon: '📋',
    baslik: 'İade Süreci',
    icerik: [
      { soru: '1. Talep Oluşturun', cevap: 'destek.gamzelieczanem@gmail.com adresine e-posta gönderin veya 0262 412 6928 numaralı hattı arayın. Sipariş numaranızı ve iade nedeninizi belirtin.' },
      { soru: '2. Kargo Kodu Alın', cevap: 'Size ücretsiz iade kargo kodu iletilir. İade kargosunu ödemek zorunda değilsiniz.' },
      { soru: '3. Ürünü Gönderin', cevap: 'Ürünü orijinal ambalajında ve eksiksiz olarak belirtilen kargo firması aracılığıyla gönderin.' },
      { soru: '4. Para İadesi', cevap: 'Ürün iade alındıktan ve kontrol edildikten sonra 3–5 iş günü içinde ödeme yönteminize iade yapılır.' },
    ],
  },
  {
    ikon: '🔄',
    baslik: 'Değişim',
    icerik: [
      { soru: 'Değişim Talebi', cevap: 'Aynı ürünün farklı renk veya varyantı için değişim talep edebilirsiniz. Stok durumuna göre işlem yapılır.' },
      { soru: 'Değişim Süresi', cevap: 'Değişim talepleri teslim tarihinden itibaren 30 gün içinde kabul edilir.' },
    ],
  },
]

export default function IadePolitikasiPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-4xl block mb-4">↩️</span>
          <h1 className="text-4xl font-bold text-stone-900 mb-3">İade Politikası</h1>
          <p className="text-stone-500">30 gün iade hakkı ile güvenle alışveriş yapın.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Hijyen Uyarısı — yasal zorunluluk, belirgin gösterilmeli */}
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Hijyen Nedeniyle İade Edilemeyen Ürünler</p>
            <p className="text-sm text-amber-700 leading-relaxed">
              6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca; <strong>ambalajı açılmış veya kullanılmış kozmetik ürünler</strong> (ruj, fondöten, maskara, serum, krem vb.) sağlık ve hijyen koşulları nedeniyle <strong>iade edilememektedir.</strong>
            </p>
            <p className="text-xs text-amber-600 mt-2">
              Ürün hasarlı, bozuk veya yanlış gönderilmişse bu kural geçerli değildir — bu durumlarda iade talebinizi kabul ederiz.
            </p>
          </div>
        </div>

        {/* Özet */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { ikon: '📅', baslik: '30 Gün', alt: 'İade süresi' },
            { ikon: '🆓', baslik: 'Ücretsiz', alt: 'İade kargo' },
            { ikon: '⚡', baslik: '3–5 İş Günü', alt: 'Para iadesi' },
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
          <p className="text-stone-700 font-semibold mb-2">İade talebinde bulunmak ister misiniz?</p>
          <p className="text-stone-500 text-sm mb-4">Sizi en kısa sürede bilgilendireceğiz.</p>
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

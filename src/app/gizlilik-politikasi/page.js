export const metadata = {
  title: 'Gizlilik Politikası – GAMZELİECZANEM',
  description: 'GAMZELİECZANEM gizlilik politikası ve kişisel veri koruma bilgilendirmesi.',
}

const BOLUMLER = [
  {
    baslik: 'Veri Sorumlusu',
    icerik:
      'Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu\'nun (KVKK) 10. maddesi uyarınca hazırlanmıştır. Veri Sorumlusu: Atalay Durmaz (Şahıs Şirketi) — Yüzbaşılar Mah. 3013. Sokak Reverans Evleri D Blok Daire 7, Gölcük / Kocaeli. Tel: 0262 412 6928. E-posta: destek@gamzelieczanem.com',
  },
  {
    baslik: '1. Toplanan Veriler',
    icerik:
      'GAMZELİECZANEM olarak; ad-soyad, e-posta adresi, telefon numarası, teslimat adresi ve ödeme bilgileri gibi kişisel verilerinizi yalnızca sipariş ve üyelik işlemleriniz için toplamaktayız. Web sitemizi ziyaretiniz sırasında çerezler aracılığıyla anonim kullanım verileri de toplanabilir.',
  },
  {
    baslik: '2. Verilerin Kullanımı',
    icerik:
      'Kişisel verileriniz; siparişlerinizin işlenmesi, kargo takibi, müşteri hizmetleri, kampanya bildirimleri (açıkça onay vermeniz halinde) ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılmaktadır. Verileriniz üçüncü taraflara satılmaz veya kiralanmaz.',
  },
  {
    baslik: '3. Veri Güvenliği',
    icerik:
      'Tüm kişisel verileriniz 256-bit SSL şifreleme ile korunmaktadır. Ödeme bilgileriniz sistemimizde saklanmaz; PCI-DSS uyumlu ödeme altyapısı üzerinden güvenle işlenir. Verilerinize yalnızca yetkili personelimiz erişebilir.',
  },
  {
    baslik: '4. Çerez Politikası',
    icerik:
      'Web sitemiz; oturum yönetimi, kullanıcı deneyiminin iyileştirilmesi ve analiz amaçlı çerezler kullanmaktadır. Zorunlu çerezler site işlevselliği için gereklidir. Analitik ve pazarlama çerezlerini tarayıcı ayarlarınızdan devre dışı bırakabilirsiniz.',
  },
  {
    baslik: '5. Haklarınız',
    icerik:
      'KVKK (Kişisel Verilerin Korunması Kanunu) kapsamında; kişisel verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama ve itiraz etme haklarına sahipsiniz. Bu haklarınızı kullanmak için destek@gamzelieczanem.com adresine yazabilir veya 0262 412 6928 numaralı hattı arayabilirsiniz.',
  },
  {
    baslik: '6. Veri Saklama Süresi',
    icerik:
      'Kişisel verileriniz, yasal zorunluluklar çerçevesinde ve hizmetin gerektirdiği süre boyunca saklanmaktadır. Üyeliğinizi silmeniz halinde verileriniz yasal saklama süreleri sonunda sistemden kaldırılır.',
  },
  {
    baslik: '7. Politika Güncellemeleri',
    icerik:
      'Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler e-posta veya site bildirimi ile duyurulur. Politikanın güncel halini bu sayfadan takip edebilirsiniz. Son güncelleme: Ocak 2026.',
  },
]

export default function GizlilikPolitikasiPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-4xl block mb-4">🔒</span>
          <h1 className="text-4xl font-bold text-stone-900 mb-3">Gizlilik Politikası</h1>
          <p className="text-stone-500">Kişisel verilerinizin güvenliği bizim için önceliktir.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl px-6 py-4 mb-8 text-sm text-stone-600 leading-relaxed">
          Bu gizlilik politikası, GAMZELİECZANEM&apos;in kişisel verilerinizi nasıl topladığını, kullandığını ve koruduğunu açıklar. Sitemizi kullanarak bu politikayı kabul etmiş sayılırsınız.
        </div>

        <div className="space-y-6">
          {BOLUMLER.map((bolum) => (
            <div key={bolum.baslik} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-stone-800 mb-3">{bolum.baslik}</h2>
              <p className="text-sm text-stone-600 leading-relaxed">{bolum.icerik}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center">
          <p className="text-stone-700 font-semibold mb-1">Sorularınız için</p>
          <p className="text-stone-500 text-sm mb-4">Gizlilik ile ilgili her türlü sorunuzu bize iletebilirsiniz.</p>
          <a
            href="mailto:destek@gamzelieczanem.com"
            className="inline-block px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-full transition-colors"
          >
            destek@gamzelieczanem.com
          </a>
        </div>
      </div>
    </div>
  )
}

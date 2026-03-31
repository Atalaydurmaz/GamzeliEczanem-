import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Hakkımızda – GAMZELİECZANEM',
  description: 'GAMZELİECZANEM\'in hikayesi, misyonu ve vizyonu hakkında bilgi edinin.',
}

const ekip = [
  { isim: 'Atalay Durmaz', unvan: 'Kurucu & CEO', renk: 'bg-rose-100 text-rose-700' },
  { isim: 'Gamze Durmaz', unvan: 'Cilt Bakım ve Kozmetik Uzmanı', renk: 'bg-pink-100 text-pink-700' },
  { isim: 'Kübra Turgut', unvan: 'Müşteri İlişkileri Yönetimi Sorumlusu', renk: 'bg-purple-100 text-purple-700' },
  { isim: 'Hilal Başoğlu', unvan: 'Ürün ve Stok Yönetimi Sorumlusu', renk: 'bg-amber-100 text-amber-700' },
  { isim: 'Çağatay Durmaz', unvan: 'Teknoloji Direktörü & CTO', renk: 'bg-blue-100 text-blue-700' },
]

export default function HakkimizdaSayfasi() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-pink-100 py-20">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="inline-block px-4 py-1.5 bg-rose-100 text-rose-600 text-xs font-semibold tracking-widest uppercase rounded-full mb-6">
            Bizim Hikayemiz
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-6">
            Güzellik Bir Yaşam Biçimidir
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed max-w-2xl mx-auto">
            GAMZELİECZANEM, 2020 yılında güzelliği herkes için erişilebilir ve keyifli kılma vizyonuyla kuruldu.
            Bugün binlerce müşterimize en kaliteli kozmetik ürünleri sunmaktan gurur duyuyoruz.
          </p>
        </div>
      </section>

      {/* Hikaye */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 mb-5">Nasıl Başladık?</h2>
              <div className="space-y-4 text-stone-500 leading-relaxed">
                <p>
                  Her şey, kaliteli cilt bakımının ve güvenilir kozmetik ürünlerinin herkes için kolayca erişilebilir olması gerektiği düşüncesiyle başladı. 
                  Sektördeki dijital dönüşümü, geleneksel güven prensipleriyle birleştirerek bu platformu hayata geçirdik.
                </p>
                <p>
                 Temel prensibimiz ilk günden beri hiç değişmedi: Şeffaflık, orijinallik ve koşulsuz müşteri memnuniyeti. 
                 Her bir ürünü titizlikle seçiyor, doğru içeriği doğru ciltle buluşturmayı en büyük sorumluluğumuz olarak görüyoruz.
                </p>
                  <p>
                  Bugün cilt bakımından makyaja, saç bakımından güneş koruyuculara kadar uzanan geniş ürün yelpazemizle binlerce 
                  mutlu müşteriye hizmet vermenin gururunu yaşıyoruz. Güzellik yolculuğunuzda, kalite ve güvenin buluşma noktasına hoş geldiniz.
                  </p>
              </div>
            </div>
            <div className="relative h-80 rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop"
                alt="GAMZELİECZANEM mağaza"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Özellikler */}
      <section className="py-16 bg-rose-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { ikon: '🤖', baslik: 'AI Eczacı Asistanı', aciklama: '7/24 kişisel cilt danışmanlığı' },
              { ikon: '🔍', baslik: 'Akıllı Arama', aciklama: 'Doğal dille ürün bulma' },
              { ikon: '🧴', baslik: 'Cilt Analizi', aciklama: '5 soruda kişisel ürün önerisi' },
              { ikon: '❤️', baslik: 'Kişisel Öneri', aciklama: 'Alışkanlıklarına göre özel öneriler' },
            ].map((o) => (
              <div key={o.baslik} className="bg-white rounded-2xl border border-rose-100 p-6 text-center shadow-sm">
                <p className="text-3xl mb-3">{o.ikon}</p>
                <p className="text-sm font-bold text-stone-800 mb-1">{o.baslik}</p>
                <p className="text-xs text-stone-400">{o.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misyon & Vizyon */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-3xl p-8 border border-rose-100">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Misyonumuz</h3>
              <p className="text-stone-500 leading-relaxed">
                Kalite, güvenilirlik ve erişilebilirlik ilkeleri doğrultusunda müşterilerimize
                en iyi kozmetik alışveriş deneyimini sunmak. Güzelliği demokratikleştirmek,
                herkesin kendini özel hissettireceği ürünleri kapısına kadar ulaştırmak.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-3xl p-8 border border-purple-100">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Vizyonumuz</h3>
              <p className="text-stone-500 leading-relaxed">
                Türkiye'nin en sevilen ve en güvenilir kozmetik platformu olmak.
                Teknoloji ve güzelliği bir araya getirerek kişiselleştirilmiş güzellik
                deneyimi sunan öncü bir marka olarak tanınmak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Değerlerimiz */}
      <section className="py-16 bg-rose-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-10">Değerlerimiz</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { ikon: '✅', baslik: 'Güvenilirlik', aciklama: '%100 orijinal ürün garantisi ve şeffaf ticaret anlayışı.' },
              { ikon: '💚', baslik: 'Sürdürülebilirlik', aciklama: 'Hayvan deneyi yapmayan markalara öncelik veriyor, çevre dostu ambalaj kullanıyoruz.' },
              { ikon: '🤝', baslik: 'Müşteri Odaklılık', aciklama: '7/24 destek, 30 gün iade hakkı ve kişiselleştirilmiş hizmet.' },
              { ikon: '🌍', baslik: 'Çeşitlilik', aciklama: 'Her cilt tonu, yaş ve cinsiyete uygun ürün yelpazesi.' },
            ].map((d) => (
              <div key={d.baslik} className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm">
                <div className="text-3xl mb-3">{d.ikon}</div>
                <h3 className="text-base font-bold text-stone-800 mb-2">{d.baslik}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{d.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ekip */}
      {/* Ekip */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-10 text-stone-900">Ekibimiz</h2>
          {/* lg:grid-cols-5 yaparak 5 kişiyi yan yana getirdik */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {ekip.map((kisi) => (
              <div key={kisi.isim} className="text-center group">
                <div className={`w-20 h-20 rounded-full ${kisi.renk} flex items-center justify-center mx-auto mb-3 text-2xl font-bold transition-transform group-hover:scale-110`}>
                  {kisi.isim.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 className="text-sm font-bold text-stone-800">{kisi.isim}</h3>
                <p className="text-xs text-stone-400 mt-0.5">{kisi.unvan}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Güzelliğini Keşfetmeye Hazır mısın?</h2>
          <p className="text-rose-100 mb-8">Binlerce ürün arasından sana özel olanı bul.</p>
          <Link
  href="/makyaj"
  className="
    relative inline-flex items-center justify-center 
    px-12 py-5 
    bg-white text-rose-600 
    font-extrabold text-lg rounded-full 
    transition-all duration-500 ease-in-out
    
    /* Parlama Efekti (Glow) */
    shadow-[0_0_20px_rgba(255,255,255,0.3)]
    
    /* Canlı Animasyonlar */
    hover:scale-110 
    hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]
    hover:text-rose-700
    
    /* Sürekli Hafif Nabız Atışı (Pulse) */
    animate-pulse
    
    /* Tıklama Hissi */
    active:scale-95 
    active:shadow-inner
    
    /* Mühendislik Şıklığı: Kenar Işıltısı */
    border border-white/20
    backdrop-blur-sm
  "
>
  <span className="relative z-10 flex items-center gap-2">
    
    <svg className="w-5 h-5 animate-bounce-x" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  </span>

            Alışverişe Başla
          </Link>
        </div>
      </section>
    </div>
  )
}

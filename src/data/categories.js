/**
 * Site kategori ağacı
 * Her ana kategori altında altKategoriler, her alt kategoride de urunler bulunur.
 * Yapı: Ana Kategori → Alt Kategori → Ürün tipi
 *
 * Örnek: Makyaj → Göz Makyajı → Maskara
 */

const kategoriler = [
  {
    id: 'anne-bebek',
    label: 'Anne & Bebek',
    href: '/anne-bebek',
    ikon: '👶',
    altKategoriler: [
      {
        id: 'bebek-bakimi',
        label: 'Bebek Bakımı',
        href: '/anne-bebek/bebek-bakimi',
        urunler: [
          { label: 'Bebek Losyonu', href: '/anne-bebek/bebek-bakimi#losyon' },
          { label: 'Bebek Şampuanı', href: '/anne-bebek/bebek-bakimi#sampuan' },
          { label: 'Bebek Kremi', href: '/anne-bebek/bebek-bakimi#krem' },
          { label: 'Bebek Pudrası', href: '/anne-bebek/bebek-bakimi#pudra' },
        ],
      },
      {
        id: 'bebek-beslenmesi',
        label: 'Bebek Beslenmesi',
        href: '/anne-bebek/bebek-beslenmesi',
        urunler: [
          { label: 'Mama', href: '/anne-bebek/bebek-beslenmesi#mama' },
          { label: 'Vitamin & Takviye', href: '/anne-bebek/bebek-beslenmesi#vitamin' },
          { label: 'Emzirme Ürünleri', href: '/anne-bebek/bebek-beslenmesi#emzirme' },
        ],
      },
      {
        id: 'anne-bakimi',
        label: 'Anne Bakımı',
        href: '/anne-bebek/anne-bakimi',
        urunler: [
          { label: 'Gebelik Kremi', href: '/anne-bebek/anne-bakimi#gebelik' },
          { label: 'Çatlak Karşıtı Krem', href: '/anne-bebek/anne-bakimi#catlak' },
          { label: 'Göğüs Bakımı', href: '/anne-bebek/anne-bakimi#gogus' },
        ],
      },
      {
        id: 'bebek-aksesuar',
        label: 'Bebek Aksesuar',
        href: '/anne-bebek/aksesuar',
        urunler: [
          { label: 'Emzik', href: '/anne-bebek/aksesuar#emzik' },
          { label: 'Biberon', href: '/anne-bebek/aksesuar#biberon' },
          { label: 'Bebek Bezi', href: '/anne-bebek/aksesuar#bez' },
        ],
      },
    ],
  },

  {
    id: 'agiz-bakimi',
    label: 'Ağız Bakımı',
    href: '/agiz-bakimi',
    ikon: '🦷',
    altKategoriler: [
      {
        id: 'dis-fircasi-macun',
        label: 'Diş Fırçası & Macun',
        href: '/agiz-bakimi/dis-fircasi-macun',
        urunler: [
          { label: 'Diş Fırçası', href: '/agiz-bakimi/dis-fircasi-macun#firca' },
          { label: 'Diş Macunu', href: '/agiz-bakimi/dis-fircasi-macun#macun' },
          { label: 'Elektrikli Fırça', href: '/agiz-bakimi/dis-fircasi-macun#elektrikli' },
          { label: 'Çocuk Diş Fırçası', href: '/agiz-bakimi/dis-fircasi-macun#cocuk' },
        ],
      },
      {
        id: 'gargara',
        label: 'Gargara & Ağız Suyu',
        href: '/agiz-bakimi/gargara',
        urunler: [
          { label: 'Ağız Gargarası', href: '/agiz-bakimi/gargara#gargara' },
          { label: 'Ağız Spreyi', href: '/agiz-bakimi/gargara#sprey' },
          { label: 'Diş İpi & Ara Yüz Fırçası', href: '/agiz-bakimi/gargara#dis-ipi' },
        ],
      },
      {
        id: 'dis-beyazlatma',
        label: 'Diş Beyazlatma',
        href: '/agiz-bakimi/beyazlatma',
        urunler: [
          { label: 'Beyazlatma Şeridi', href: '/agiz-bakimi/beyazlatma#serit' },
          { label: 'Beyazlatma Kalemi', href: '/agiz-bakimi/beyazlatma#kalem' },
          { label: 'Beyazlatma Macunu', href: '/agiz-bakimi/beyazlatma#macun' },
        ],
      },
      {
        id: 'protez-ortodonti',
        label: 'Protez & Ortodonti',
        href: '/agiz-bakimi/protez',
        urunler: [
          { label: 'Protez Tableti', href: '/agiz-bakimi/protez#tablet' },
          { label: 'Ortodonti Bakım Seti', href: '/agiz-bakimi/protez#ortodonti' },
        ],
      },
    ],
  },

  {
    id: 'cilt-bakimi',
    label: 'Cilt Bakımı',
    href: '/cilt-bakimi',
    ikon: '🧴',
    altKategoriler: [
      {
        id: 'yuz-bakimi',
        label: 'Yüz Bakımı',
        href: '/cilt-bakimi/yuz-bakimi',
        urunler: [
          { label: 'Nemlendirici Krem', href: '/cilt-bakimi#nemlendirici' },
          { label: 'Serum', href: '/cilt-bakimi#serum' },
          { label: 'Göz Kremi', href: '/cilt-bakimi#goz-kremi' },
          { label: 'Yüz Maskesi', href: '/cilt-bakimi#maske' },
        ],
      },
      {
        id: 'temizleme-tonik',
        label: 'Temizleme & Tonik',
        href: '/cilt-bakimi/temizleme',
        urunler: [
          { label: 'Yüz Temizleyici Jel', href: '/cilt-bakimi#temizleyici' },
          { label: 'Makyaj Temizleyici', href: '/cilt-bakimi#makyaj-temizleyici' },
          { label: 'Tonik', href: '/cilt-bakimi#tonik' },
          { label: 'Misel Su', href: '/cilt-bakimi#misel' },
        ],
      },
      {
        id: 'vucut-bakimi',
        label: 'Vücut Bakımı',
        href: '/cilt-bakimi/vucut',
        urunler: [
          { label: 'Vücut Losyonu', href: '/cilt-bakimi#vucut-losyon' },
          { label: 'Vücut Yağı', href: '/cilt-bakimi#vucut-yagi' },
          { label: 'Vücut Peeling', href: '/cilt-bakimi#peeling' },
        ],
      },
      {
        id: 'anti-aging',
        label: 'Anti-Aging',
        href: '/cilt-bakimi/anti-aging',
        urunler: [
          { label: 'Kırışıklık Karşıtı Krem', href: '/cilt-bakimi#kirisiklik' },
          { label: 'Retinol', href: '/cilt-bakimi#retinol' },
          { label: 'Kolajen Takviye', href: '/cilt-bakimi#kolajen' },
        ],
      },
    ],
  },

  {
    id: 'yuz-bakimi',
    label: 'Yüz Bakımı',
    href: '/yuz-bakimi',
    ikon: '🧖',
    altKategoriler: [
      {
        id: 'temizleme',
        label: 'Temizleme',
        href: '/yuz-bakimi/temizleme',
        urunler: [
          { label: 'Yüz Temizleme Jeli', href: '/yuz-bakimi#jel' },
          { label: 'Temizleme Köpüğü', href: '/yuz-bakimi#kopuk' },
          { label: 'Miseller Su', href: '/yuz-bakimi#miseller' },
          { label: 'Yüz Peelingi', href: '/yuz-bakimi#peeling' },
        ],
      },
      {
        id: 'nemlendirme',
        label: 'Nemlendirme',
        href: '/yuz-bakimi/nemlendirme',
        urunler: [
          { label: 'Günlük Nemlendirici', href: '/yuz-bakimi#nemlendirici' },
          { label: 'Yüz Kremi', href: '/yuz-bakimi#krem' },
          { label: 'Yüz Yağı', href: '/yuz-bakimi#yag' },
        ],
      },
      {
        id: 'ozel-bakim',
        label: 'Özel Bakım',
        href: '/yuz-bakimi/ozel-bakim',
        urunler: [
          { label: 'Yüz Serumu', href: '/yuz-bakimi#serum' },
          { label: 'Göz Çevresi Bakımı', href: '/yuz-bakimi#goz' },
          { label: 'Yüz Maskesi', href: '/yuz-bakimi#maske' },
          { label: 'Leke Karşıtı Bakım', href: '/yuz-bakimi#leke' },
        ],
      },
      {
        id: 'tonik-bakim',
        label: 'Tonik & Onarıcı',
        href: '/yuz-bakimi/tonik',
        urunler: [
          { label: 'Yüz Toniği', href: '/yuz-bakimi#tonik' },
          { label: 'Termal Su', href: '/yuz-bakimi#termal' },
          { label: 'Onarıcı Balsam', href: '/yuz-bakimi#balsam' },
        ],
      },
    ],
  },

  {
    id: 'makyaj',
    label: 'Makyaj',
    href: '/makyaj',
    ikon: '💄',
    altKategoriler: [
      {
        id: 'goz-makyaji',
        label: 'Göz Makyajı',
        href: '/makyaj/goz',
        urunler: [
          { label: 'Maskara', href: '/makyaj#maskara' },
          { label: 'Eyeliner', href: '/makyaj#eyeliner' },
          { label: 'Far Paleti', href: '/makyaj#far' },
          { label: 'Kaş Kalemi & Pomadı', href: '/makyaj#kas' },
        ],
      },
      {
        id: 'yuz-makyaji',
        label: 'Yüz Makyajı',
        href: '/makyaj/yuz',
        urunler: [
          { label: 'Fondöten', href: '/makyaj#fondoten' },
          { label: 'Kapatıcı', href: '/makyaj#kapatici' },
          { label: 'Allık', href: '/makyaj#allik' },
          { label: 'Aydınlatıcı', href: '/makyaj#aydinlatici' },
        ],
      },
      {
        id: 'dudak-makyaji',
        label: 'Dudak Makyajı',
        href: '/makyaj/dudak',
        urunler: [
          { label: 'Ruj', href: '/makyaj#ruj' },
          { label: 'Dudak Parlatıcı', href: '/makyaj#parlatici' },
          { label: 'Dudak Kalemi', href: '/makyaj#dudak-kalemi' },
        ],
      },
      {
        id: 'makyaj-aksesuar',
        label: 'Makyaj Aksesuar',
        href: '/makyaj/aksesuar',
        urunler: [
          { label: 'Fırça Seti', href: '/makyaj#firca' },
          { label: 'Makyaj Süngeri', href: '/makyaj#sunger' },
          { label: 'Makyaj Sabitleme Spreyi', href: '/makyaj#sabitleme' },
        ],
      },
    ],
  },

  {
    id: 'sac-bakimi',
    label: 'Saç Bakımı',
    href: '/sac-bakimi',
    ikon: '💇',
    altKategoriler: [
      {
        id: 'sampuan-sac-kremi',
        label: 'Şampuan & Saç Kremi',
        href: '/sac-bakimi/sampuan',
        urunler: [
          { label: 'Şampuan', href: '/sac-bakimi#sampuan' },
          { label: 'Saç Kremi', href: '/sac-bakimi#sac-kremi' },
          { label: 'Saç Bakım Maskesi', href: '/sac-bakimi#sac-maskesi' },
        ],
      },
      {
        id: 'sac-serum-yag',
        label: 'Serum & Yağ',
        href: '/sac-bakimi/serum-yag',
        urunler: [
          { label: 'Saç Serumu', href: '/sac-bakimi#serum' },
          { label: 'Saç Yağı', href: '/sac-bakimi#sac-yagi' },
          { label: 'Argan Yağı', href: '/sac-bakimi#argan' },
        ],
      },
      {
        id: 'sac-sekillendirici',
        label: 'Şekillendirici',
        href: '/sac-bakimi/sekillendirici',
        urunler: [
          { label: 'Saç Spreyi', href: '/sac-bakimi#sprey' },
          { label: 'Saç Köpüğü', href: '/sac-bakimi#kopuk' },
          { label: 'Jöle & Wax', href: '/sac-bakimi#jole' },
        ],
      },
      {
        id: 'sac-boyasi',
        label: 'Saç Boyası & Renk',
        href: '/sac-bakimi/boya',
        urunler: [
          { label: 'Saç Boyası', href: '/sac-bakimi#boya' },
          { label: 'Renk Koruyucu Şampuan', href: '/sac-bakimi#renk-koruyucu' },
          { label: 'Işıltı & Parlaklık', href: '/sac-bakimi#isiltı' },
        ],
      },
    ],
  },

  {
    id: 'gunes-bakimi',
    label: 'Güneş Koruyucu',
    href: '/gunes-koruyucu',
    ikon: '☀️',
    altKategoriler: [
      {
        id: 'gunes-koruma',
        label: 'Güneş Koruma',
        href: '/gunes-koruyucu/koruma',
        urunler: [
          { label: 'SPF 30 Güneş Kremi', href: '/gunes-bakimi#spf30' },
          { label: 'SPF 50 Güneş Kremi', href: '/gunes-bakimi#spf50' },
          { label: 'SPF 50+ Güneş Kremi', href: '/gunes-bakimi#spf50plus' },
          { label: 'Çocuk Güneş Kremi', href: '/gunes-bakimi#cocuk' },
        ],
      },
      {
        id: 'after-sun',
        label: 'After Sun',
        href: '/gunes-koruyucu/after-sun',
        urunler: [
          { label: 'After Sun Losyon', href: '/gunes-bakimi#after-sun-losyon' },
          { label: 'After Sun Jel', href: '/gunes-bakimi#after-sun-jel' },
          { label: 'Güneş Sonrası Krem', href: '/gunes-bakimi#gunes-sonrasi' },
        ],
      },
      {
        id: 'bronzlastirici',
        label: 'Bronzlaştırıcı',
        href: '/gunes-koruyucu/bronzlastirici',
        urunler: [
          { label: 'Bronzlaştırıcı Krem', href: '/gunes-bakimi#bronz-krem' },
          { label: 'Bronzlaştırıcı Yağ', href: '/gunes-bakimi#bronz-yag' },
          { label: 'Kendi Kendine Bronzlaştırıcı', href: '/gunes-bakimi#self-bronz' },
        ],
      },
      {
        id: 'dudak-sac-koruma',
        label: 'Dudak & Saç Koruma',
        href: '/gunes-koruyucu/dudak-sac',
        urunler: [
          { label: 'Güneş Dudak Balsamı', href: '/gunes-bakimi#dudak-balsam' },
          { label: 'Saç Güneş Spreyi', href: '/gunes-bakimi#sac-sprey' },
        ],
      },
    ],
  },

]
  
export default kategoriler

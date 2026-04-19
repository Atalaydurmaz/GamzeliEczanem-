'use client'

import { useState } from 'react'
import Link from 'next/link'

const kategoriler = [
  {
    baslik: '🚚 Kargo ve Teslimat',
    sorular: [
      {
        soru: 'Siparişim ne zaman teslim edilir?',
        cevap: 'Siparişleriniz onaylandıktan sonra 1–3 iş günü içinde kargoya verilir. Kargo teslim süresi şehirlerarası için 1–2 iş günüdür. Toplam süre genellikle 2–5 iş günüdür.',
      },
      {
        soru: 'Kargo ücreti ne kadar?',
        cevap: '1.500₺ ve üzeri siparişlerde kargo tamamen ücretsizdir. 1.500₺ altındaki siparişler için kargo ücreti 130₺\'dir.',
      },
      {
        soru: 'Hangi kargo şirketleriyle çalışıyorsunuz?',
        cevap: 'Trendyol Express ve Yurtiçi Kargo ile çalışmaktayız. Sipariş durumunuza göre hangisiyle gönderileceği bildirilir.',
      },
      {
        soru: 'Siparişimi nasıl takip edebilirim?',
        cevap: 'Sipariş takip numarası e-posta ve telefon numaranıza gönderilir.',
      },
    ],
  },
  {
    baslik: '↩️ İade ve Değişim',
    sorular: [
      {
        soru: 'Ürünü iade edebilir miyim?',
        cevap: 'Evet! Teslim tarihinden itibaren 30 gün içinde iade talebinde bulunabilirsiniz. Ürünün orijinal ambalajında ve kullanılmamış olması gerekmektedir.',
      },
      {
        soru: 'Açılmış kozmetik ürünleri iade edilebilir mi?',
        cevap: 'Sağlık ve hijyen nedeniyle açılmış veya kullanılmış kozmetik ürünler iade edilememektedir. Ancak ürün hasarlı veya yanlış geldiyse istisnai olarak değerlendirilebilir.',
      },
      {
        soru: 'İade süreci nasıl işliyor?',
        cevap: 'destek@gamzelidermokozmetik.com adresine e-posta gönderin veya 0262 412 6928 numaralı hattı arayın. Size iade talimatları ve kargo kodu iletilir. İade kargosunu ödemek zorunda değilsiniz.',
      },
      {
        soru: 'Para iadesi ne zaman yapılır?',
        cevap: 'Ürün iade alındıktan ve kontrol edildikten sonra 3–5 iş günü içinde ödeme yönteminize iade yapılır.',
      },
    ],
  },
  {
    baslik: '✅ Ürünler ve Kalite',
    sorular: [
      {
        soru: 'Ürünler orijinal mi?',
        cevap: 'Evet, tüm ürünler yetkili distribütörler ve resmi markalar aracılığıyla temin edilmektedir. Her ürün için orijinallik garantisi veriyoruz.',
      },
      {
        soru: 'Ürünlerin son kullanma tarihleri güvenilir mi?',
        cevap: 'Tüm ürünler stoklanmadan önce son kullanma tarihleri kontrol edilmektedir. Son kullanma tarihine en az 12 ay kalan ürünler satışa sunulmaktadır.',
      },
      {
        soru: 'Vegan veya cruelty-free ürünler var mı?',
        cevap: 'Evet! Ürün sayfalarında vegan ve cruelty-free etiketlerini görebilirsiniz. Hayvan deneyi yapmayan markaları özellikle destekliyoruz.',
      },
    ],
  },
  {
    baslik: '💳 Ödeme',
    sorular: [
      {
        soru: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
        cevap: 'VISA, Mastercard ve TROY markalı kredi/banka kartları ile ödeme yapabilirsiniz. Tüm ödemeler 256-bit SSL şifreleme ile güvence altındadır.',
      },
      {
        soru: 'Taksit imkânı var mı?',
        cevap: 'Anlaşmalı bankalarımızın kredi kartlarıyla 3 taksit seçeneği mevcuttur. Taksit seçenekleri checkout sırasında görüntülenir.',
      },
      {
        soru: 'Ödeme güvenli mi?',
        cevap: 'Tüm ödemeler PCI-DSS uyumlu altyapımızda 256-bit SSL şifreleme ile güvence altındadır. Kart bilgileriniz sistemimizde saklanmaz.',
      },
    ],
  },
  {
    baslik: '👤 Hesap ve Üyelik',
    sorular: [
      {
        soru: 'Üye olmadan sipariş verebilir miyim?',
        cevap: 'Evet, misafir olarak sipariş verebilirsiniz. Ancak üye olmanız durumunda sipariş geçmişinizi görüntüleyebilir ve özel üye indirimlerinden yararlanabilirsiniz.',
      },
      {
        soru: 'Şifremi unuttum, ne yapmalıyım?',
        cevap: 'Giriş sayfasındaki "Şifremi Unuttum" bağlantısına tıklayın. Kayıtlı e-posta adresinize şifre yenileme bağlantısı gönderilecektir.',
      },
    ],
  },
]

function AkordeonOgesi({ soru, cevap }) {
  const [acik, setAcik] = useState(false)
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${acik ? 'border-rose-200 bg-rose-50/30' : 'border-stone-100 bg-white'}`}>
      <button
        onClick={() => setAcik(!acik)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className={`text-sm font-medium ${acik ? 'text-rose-700' : 'text-stone-800'}`}>{soru}</span>
        <svg
          className={`w-5 h-5 shrink-0 transition-transform ${acik ? 'rotate-180 text-rose-500' : 'text-stone-400'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {acik && (
        <div className="px-5 pb-4">
          <p className="text-sm text-stone-500 leading-relaxed">{cevap}</p>
        </div>
      )}
    </div>
  )
}

export default function SSSSayfasi() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold text-stone-900 mb-3">Sıkça Sorulan Sorular</h1>
          <p className="text-stone-500">Merak ettiğiniz her şeyin cevabı burada.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {kategoriler.map((kat) => (
          <div key={kat.baslik}>
            <h2 className="text-lg font-bold text-stone-800 mb-4">{kat.baslik}</h2>
            <div className="space-y-2">
              {kat.sorular.map((item) => (
                <AkordeonOgesi key={item.soru} soru={item.soru} cevap={item.cevap} />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
          <p className="text-stone-700 font-semibold mb-2">Cevap bulamadınız mı?</p>
          <p className="text-stone-500 text-sm mb-4">Müşteri hizmetlerimiz sizin için burada.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="tel:02624126928" className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-full transition-colors">
              📞 Bizi Ara
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

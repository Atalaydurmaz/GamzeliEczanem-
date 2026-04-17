'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const NEDEN_MESAJ = {
  '3ds':         '3D Secure kodu yanlış veya zaman aşımı oldu. Kartınızdan ücret kesilmedi, yeni bir kod ile tekrar deneyebilirsiniz.',
  odeme:         'Kart bilgileriniz doğrulanamadı veya ödeme reddedildi.',
  bakiye:        'Kartınızda yeterli bakiye bulunmuyor.',
  reddedildi:    'Bankanız işlemi güvenlik nedeniyle reddetti. Lütfen bankanızla iletişime geçin.',
  kayip:         'Bu kart kayıp olarak işaretlendiği için işlem gerçekleştirilemedi.',
  calinti:       'Bu kart çalıntı olarak işaretlendiği için işlem gerçekleştirilemedi.',
  sonkullanim:   'Kartınızın son kullanma tarihi geçmiş.',
  kartno:        'Girdiğiniz kart numarası geçersiz. Lütfen tekrar kontrol edin.',
  veri:          'Oturum süresi doldu, lütfen tekrar deneyin.',
  stok:          'Sipariş işlenirken bir ürün stokta tükendi. Lütfen sepetinizi güncelleyip tekrar deneyin.',
  tutar:         'Ödeme tutarında bir uyuşmazlık tespit edildi. Kartınızdan herhangi bir ücret kesilmediyse ya kesildi ise otomatik iade edildi.',
  kayit:         'Sipariş kaydedilirken bir hata oluştu. Ödemeniz alındıysa otomatik iade edildi.',
}

// Spesifik nedenler için tek cümle — "sık karşılaşılan nedenler" listesi gösterilmez
const SPESIFIK_NEDENLER = new Set(['bakiye', 'reddedildi', 'kayip', 'calinti', 'sonkullanim', 'kartno', '3ds'])

function BasarisizIcerik() {
  const params = useSearchParams()
  const neden = params.get('neden') || 'odeme'
  const mesaj = NEDEN_MESAJ[neden] || NEDEN_MESAJ.odeme

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-rose-50/30 px-4 py-16">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-stone-900 mb-2">Ödeme Başarısız</h1>
        <p className="text-stone-500 text-sm mb-6">{mesaj}</p>

        {SPESIFIK_NEDENLER.has(neden) ? null : neden === 'stok' ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-stone-600 text-left">
            <p className="font-semibold text-stone-700 mb-2">Ne oldu?</p>
            <p>Ödemeniz alındı ancak siz ödeme yaparken başka bir müşteri aynı ürünü satın aldı ve stok tükendi.</p>
            <p className="mt-2 font-semibold text-amber-700">Kartınızdan herhangi bir ücret kesilmedi veya kesildi ise otomatik olarak iade edildi.</p>
          </div>
        ) : neden === 'tutar' || neden === 'kayit' ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-stone-600 text-left">
            <p className="font-semibold text-stone-700 mb-2">Ne yapmalıyım?</p>
            <p>Kartınızdan ücret kesildiyse 3–5 iş günü içinde otomatik olarak iade edilecektir.</p>
            <p className="mt-2">
              Sorun çözülmezse{' '}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=destek.gamzelieczanem@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-600 font-semibold hover:underline"
              >
                destek.gamzelieczanem@gmail.com
              </a>
              {' '}adresine yazabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6 text-sm text-stone-600 text-left space-y-1">
            <p className="font-semibold text-stone-700 mb-2">Sık karşılaşılan nedenler:</p>
            <p>• Kart bilgisi hatalı girilmiş olabilir</p>
            <p>• Kartınızda yeterli bakiye olmayabilir</p>
            <p>• Bankanız işlemi güvenlik nedeniyle engellemiş olabilir</p>
            <p>• 3D Secure onayı zaman aşımına uğramış olabilir</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/sepet"
            className="flex-1 py-3 px-4 border border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-colors text-sm"
          >
            Sepete Dön
          </Link>
          <Link
            href="/odeme"
            className="flex-1 py-3 px-4 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-colors text-sm"
          >
            Tekrar Dene
          </Link>
        </div>

        <p className="mt-5 text-xs text-stone-400">
          Sorun devam ederse{' '}
          <a href="tel:02624126928" className="text-rose-500 font-medium hover:underline">
            0262 412 6928
          </a>{' '}
          numaramızı arayın.
        </p>
      </div>
    </div>
  )
}

export default function OdemeBasarisizSayfasi() {
  return (
    <Suspense>
      <BasarisizIcerik />
    </Suspense>
  )
}

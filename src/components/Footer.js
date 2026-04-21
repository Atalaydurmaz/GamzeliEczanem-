import Link from 'next/link'
import NewsletterForm from '@/components/NewsletterForm'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Marka */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/icon.png" alt="GAMZELİECZANEM" width="32" height="32" loading="lazy" className="w-8 h-8 object-contain rounded-lg" />
              <span className="text-xl font-bold tracking-widest text-rose-400 uppercase">GAMZELİECZANEM</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed mb-5">
              Güzelliğinizi keşfedin. En kaliteli kozmetik ürünleri ile kendinizi özel hissedin.
            </p>
            <div className="flex gap-3">
              {[
                { label: 'Instagram', href: 'https://instagram.com/gamzelieczanem/', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
              ].map((s) => (
                <a key={s.label} href={s.href ?? '#'} aria-label={s.label} target={s.href ? '_blank' : undefined} rel={s.href ? 'noopener noreferrer' : undefined}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-800 text-stone-400 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.d} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Kategoriler */}
          <div>
            <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-widest mb-4">Kategoriler</h3>
            <ul className="space-y-2">
              {[
                { href: '/makyaj', label: 'Makyaj' },
                { href: '/cilt-bakimi', label: 'Cilt Bakımı' },
                { href: '/yuz-bakimi', label: 'Yüz Bakımı' },
                { href: '/sac-bakimi', label: 'Saç Bakımı' },
                { href: '/anne-bebek', label: 'Anne & Bebek' },
                { href: '/gunes-koruyucu', label: 'Güneş Koruyucu' },
                { href: '/agiz-bakimi', label: 'Ağız Bakımı' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-stone-400 hover:text-rose-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-widest mb-4">Kurumsal</h3>
            <ul className="space-y-2">
              {[
                { href: '/siparis-takip', label: 'Sipariş Takip' },
                { href: '/hakkimizda', label: 'Hakkımızda' },
                { href: '/iletisim', label: 'İletişim' },
                { href: '/sss', label: 'Sıkça Sorulan Sorular' },
                { href: '/kargo-teslimat', label: 'Kargo & Teslimat' },
                { href: '/iade-politikasi', label: 'İade Politikası' },
                { href: '/gizlilik-politikasi', label: 'KVKK Aydınlatma Metni' },
                { href: '/mesafeli-satis-sozlesmesi', label: 'Mesafeli Satış Sözleşmesi' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-stone-400 hover:text-rose-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bülten + İletişim */}
          <div>
            <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-widest mb-4">Bülten</h3>
            <p className="text-sm text-stone-400 mb-4">Yeni ürünler ve özel indirimlerden haberdar olun.</p>
            <NewsletterForm />
            <div className="mt-5 pt-5 border-t border-stone-800 space-y-2">
              <a href="tel:02624126928" className="flex items-center gap-2 text-sm text-stone-400 hover:text-rose-400 transition-colors">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                0262 412 6928
              </a>
              <a href="/iletisim" className="flex items-center gap-2 text-sm text-stone-400 hover:text-rose-400 transition-colors">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                destek@gamzelidermokozmetik.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">© 2026 GAMZELİECZANEM. Tüm hakları saklıdır.</p>

          {/* ETBİS Kayıt Etiketi */}
          <a
            href="https://etbis.ticaret.gov.tr/sitesorgulama?SiteUrl=gamzelidermokozmetik.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ETBİS Kayıt Bilgileri"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 hover:border-rose-500 transition-colors"
          >
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold text-stone-200 uppercase tracking-wider">ETBİS'e Kayıtlıdır</span>
              <span className="text-[10px] text-stone-400">Site Kayıt No: 5267474226</span>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-500">Güvenli ödeme</span>
            <div className="flex gap-2">
              {['VISA', 'MC', 'TROY'].map((c) => (
                <span key={c} className="px-2 py-0.5 bg-stone-800 text-stone-400 text-xs rounded border border-stone-700">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

import { Geist } from 'next/font/google'
import './globals.css'
import ShopShell from '@/components/ShopShell'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { FavoriProvider } from '@/context/FavoriContext'
import { ReviewProvider } from '@/context/ReviewContext'
import { StockProvider } from '@/context/StockContext'
import NextAuthProvider from '@/components/NextAuthProvider'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

const BASE_URL = 'https://gamzelieczanem.com'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // iPhone notch / safe area için
  themeColor: '#f43f5e', // Safari adres çubuğu ve PWA rengi
}

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'GAMZELİECZANEM | Eczacı Güvencesiyle Dermokozmetik',
    template: '%s | GAMZELİECZANEM',
  },
  description: 'Eczacı güvencesiyle dermokozmetik, makyaj, cilt bakımı ve saç bakımı ürünleri. Orijinal ürün garantisi, ücretsiz kargo.',
  openGraph: {
    siteName: 'GAMZELİECZANEM',
    locale: 'tr_TR',
    type: 'website',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'GAMZELİECZANEM' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-white text-stone-900 antialiased">
        <NextAuthProvider>
          <AuthProvider>
            <CartProvider>
              <FavoriProvider>
                <ReviewProvider>
                <StockProvider>
                <ShopShell>{children}</ShopShell>
                </StockProvider>
                </ReviewProvider>
              </FavoriProvider>
            </CartProvider>
          </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}

import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatBotLazy from '@/components/ChatBotLazy'
import PushManager from '@/components/PushManager'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { FavoriProvider } from '@/context/FavoriContext'
import { ReviewProvider } from '@/context/ReviewContext'
import { StockProvider } from '@/context/StockContext'
import NextAuthProvider from '@/components/NextAuthProvider'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const BASE_URL = 'https://gamzelieczanem.com'

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
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <ChatBotLazy />
                <PushManager />
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

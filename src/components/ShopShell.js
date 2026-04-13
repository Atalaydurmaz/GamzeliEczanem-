'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatBotLazy from '@/components/ChatBotLazy'
import PushManager from '@/components/PushManager'
import CookieBanner from '@/components/CookieBanner'
import ScrollRestorer from '@/components/ScrollRestorer'

export default function ShopShell({ children }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatBotLazy />
      <PushManager />
      <CookieBanner />
      <ScrollRestorer />
    </>
  )
}

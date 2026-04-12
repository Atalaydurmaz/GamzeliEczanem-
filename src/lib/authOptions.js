import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        sifre: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.sifre) return null
        const { data: uye } = await supabaseAdmin
          .from('users')
          .select('id, ad, email, sifre_hash, onaylar')
          .eq('email', credentials.email.toLowerCase())
          .maybeSingle()
        if (!uye || !uye.sifre_hash) return null
        const eslesme = await bcrypt.compare(credentials.sifre, uye.sifre_hash)
        if (!eslesme) return null
        return { id: uye.id, name: uye.ad, email: uye.email, onaylar: uye.onaylar }
      },
    }),
  ],

  pages: { signIn: '/hesabim/giris' },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const { data: mevcut } = await supabaseAdmin
          .from('users')
          .select('id, sifre_hash')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()

        if (!mevcut) {
          // İlk Google girişi — yeni hesap oluştur, şifre kurulum sayfasına yönlendir
          const { data } = await supabaseAdmin
            .from('users')
            .insert({
              ad: user.name,
              email: user.email.toLowerCase(),
              sifre_hash: null,
              onaylar: { email: false, sms: false, telefon: false },
            })
            .select('id')
            .single()

          if (data) {
            user.dbId = data.id
            user.sifreKurulumu = true  // İlk girişte şifre kurulum sayfasına yönlendir
          }
        } else {
          // Aynı email ile daha önce kayıt olmuş — mevcut hesaba bağla
          user.dbId = mevcut.id
          user.sifreKurulumu = !mevcut.sifre_hash  // Şifresi yoksa kurulum sayfasına yönlendir
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.dbId || user.id
        token.ad = user.name
        token.email = user.email
        token.provider = account?.provider
        token.sifreKurulumu = user.sifreKurulumu || false
      }
      // update() çağrısıyla session yenilendiğinde sifreKurulumu'nu temizle
      if (trigger === 'update' && session?.sifreKurulumu === false) {
        token.sifreKurulumu = false
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = token.id
      session.user.ad = token.ad
      session.user.email = token.email
      session.user.provider = token.provider
      session.user.sifreKurulumu = token.sifreKurulumu
      return session
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}

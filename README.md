# 💊 Gamzelieczanem — Kozmetik E-Ticaret

![Hero](public/hero-skincare.png)

Eczacı güvencesiyle kozmetik ve kişisel bakım ürünleri sunan modern e-ticaret platformu.

## ✨ Öne Çıkan Özellikler

- **🤖 AI Cilt Analizi** — Anket tabanlı kişiselleştirilmiş ürün önerileri
- **💄 Sanal Makyaj Deneme** — Face API ile gerçek zamanlı ruj, allık ve far simülasyonu
- **💳 Güvenli Ödeme** — Iyzico entegrasyonu ile kredi kartı / banka kartı
- **👤 Kullanıcı Hesabı** — Email/şifre + Google OAuth, sipariş geçmişi, favoriler
- **🛒 Tam E-Ticaret** — Sepet, indirim kodları, sipariş takibi, stok yönetimi
- **📧 Bildirimler** — Email (SMTP) ve SMS (Netgsm) ile sipariş bildirimleri
- **🔐 Admin Paneli** — Ürün, sipariş ve kullanıcı yönetimi

## 🛠️ Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes, NextAuth |
| Veritabanı | Supabase (PostgreSQL) |
| Ödeme | Iyzico |
| AI | Anthropic Claude SDK, face-api.js |
| Deploy | Vercel |

## 📁 Proje Yapısı

```
app/
├── (shop)/           # Ana mağaza sayfaları
│   ├── urunler/      # Ürün listesi ve detay
│   ├── cilt-analizi/ # AI cilt analizi
│   ├── sanal-deneme/ # Sanal makyaj deneme
│   ├── sepet/        # Alışveriş sepeti
│   └── hesabim/      # Kullanıcı hesabı
├── admin/            # Admin paneli
├── api/              # API routes
└── odeme/            # Ödeme sayfaları
```

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env.local dosyasını oluştur
cp .env.example .env.local

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

## ⚙️ Ortam Değişkenleri

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Iyzico
IYZICO_API_KEY=
IYZICO_SECRET_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

## 📦 Kategoriler

| Kategori | Açıklama |
|----------|----------|
| Cilt Bakım | Temizleyici, nemlendirici, serum |
| Makyaj | Ruj, fondöten, maskara |
| Güneş Bakım | SPF koruma ürünleri |
| Saç Bakım | Şampuan, saç maskesi |
| Ağız Bakım | Diş macunu, gargara |
| Bebek Bakım | Bebek şampuanı, krem |

## 📄 Lisans

Bu proje özel kullanım içindir. Tüm hakları saklıdır.

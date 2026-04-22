<h1 align="center">💊 Gamzelieczanem</h1>

<p align="center">
  <strong>🤖 An AI-powered e-commerce platform for cosmetics and personal care</strong>
  <br/>
  <sub>Trusted by pharmacists · AI skin analysis · Virtual makeup try-on · 24/7 Pharmacist Assistant</sub>
</p>

<p align="center">
  <a href="https://gamzelidermokozmetik.com">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-gamzelidermokozmetik.com-ec4899?style=for-the-badge" alt="Live Demo" />
  </a>
  <a href="https://gamzelidermokozmetik.com">
    <img src="https://img.shields.io/badge/▲_Vercel-Deploy-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Iyzico-Payment-1e40af?style=flat-square" />
  <img src="https://img.shields.io/badge/Anthropic-Claude-d97757?style=flat-square&logo=anthropic&logoColor=white" />
</p>

<p align="center">
  <img src="screenshots/01-anasayfa.png" width="92%" alt="Gamzelieczanem — Home Page" />
</p>

---

## ✨ Main Features

- 🤖 **AI Skin Analysis** — Personal product suggestions based on a short survey (powered by Anthropic Claude)
- 💄 **Virtual Makeup Try-On** — Real-time lipstick, blush, and eyeshadow simulation with face-api.js
- 💳 **Safe Payment** — Credit and debit card payment with Iyzico
- 👤 **User Account** — Email and Google login, order history, and favorites
- 🛒 **Full E-Commerce** — Cart, discount codes, order tracking, and stock control
- 📧 **Notifications** — Order updates by email (SMTP) and SMS (Netgsm)
- 🔐 **Admin Panel** — Manage products, orders, and users
- 🧠 **24/7 Pharmacist Assistant** — An AI chat that helps you choose the right product

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><strong>Home Page</strong><br/><img src="screenshots/01-anasayfa.png" alt="Home Page" /></td>
    <td width="50%"><strong>Products</strong><br/><img src="screenshots/02-urunler.png" alt="Product List" /></td>
  </tr>
  <tr>
    <td width="50%"><strong>AI Skin Analysis</strong><br/><img src="screenshots/04-cilt-analizi.png" alt="AI Skin Analysis" /></td>
    <td width="50%"><strong>Virtual Makeup Try-On</strong><br/><img src="screenshots/05-sanal-deneme.png" alt="Virtual Try-On" /></td>
  </tr>
  <tr>
    <td width="50%"><strong>Cart</strong><br/><img src="screenshots/06-sepet.png" alt="Cart" /></td>
    <td width="50%"><strong>Login / Account</strong><br/><img src="screenshots/07-giris.png" alt="Login" /></td>
  </tr>
</table>

### 📱 Mobile View

<p align="center">
  <img src="screenshots/08-mobil-anasayfa.png" width="42%" alt="Mobile Home Page" />
  &nbsp;&nbsp;
  <img src="screenshots/09-mobil-urunler.png" width="42%" alt="Mobile Products" />
</p>

---

## 🛠️ Technology

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 · React 19 · Tailwind CSS · Framer Motion |
| Backend | Next.js API Routes · NextAuth |
| Database | Supabase (PostgreSQL) |
| Payment | Iyzico |
| AI | Anthropic Claude SDK · face-api.js |
| Email & SMS | SMTP · Netgsm |
| Deploy | Vercel (cron jobs: abandoned-cart, routine-reminder) |

---

## 📁 Project Structure

```
src/app/
├── (shop)/                   # Shop pages
│   ├── urunler/              # Product list & detail
│   ├── cilt-analizi/         # AI skin analysis
│   ├── sanal-deneme/         # Virtual makeup try-on
│   ├── sepet/                # Shopping cart
│   └── hesabim/              # User account
├── admin/                    # Admin panel
├── api/                      # API route handlers
│   ├── odeme/                # Iyzico callback & checkout
│   ├── terk-sepet/           # Abandoned cart cron
│   └── rutin-hatirlatici/    # Routine reminder cron
└── odeme/                    # Payment pages
```

---

## 🚀 Local Setup

```bash
git clone https://github.com/Atalaydurmaz/GamzeliEczanem-.git
cd GamzeliEczanem-
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### ⚙️ Environment Variables

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

# Anthropic Claude (AI skin analysis & assistant)
ANTHROPIC_API_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=

# SMS (Netgsm)
NETGSM_USER=
NETGSM_PASSWORD=
```

---

## 📦 Categories

| Category | Description |
|----------|-------------|
| Skin Care | Cleanser, moisturizer, serum |
| Makeup | Lipstick, foundation, mascara |
| Sun Protection | SPF products |
| Hair Care | Shampoo, hair mask |
| Oral Care | Toothpaste, mouthwash |
| Mother & Baby | Baby shampoo, baby cream |

---

<p align="center">
  <sub>Developer: <a href="https://github.com/Atalaydurmaz">@Atalaydurmaz</a></sub>
</p>

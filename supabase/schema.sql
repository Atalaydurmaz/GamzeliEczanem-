-- ============================================================
-- GAMZELİECZANEM — Supabase Schema
-- SQL Editor'da çalıştırın
-- ============================================================

-- Kullanıcılar (email/şifre + Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad          TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  sifre_hash  TEXT,                    -- NULL = sadece Google ile giriş
  onaylar     JSONB       DEFAULT '{"email": false, "sms": false, "telefon": false}',
  kayit_tarihi TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Ürünler
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY,
  ad          TEXT NOT NULL,
  kategori    TEXT NOT NULL,
  alt_kategori TEXT,
  fiyat       NUMERIC NOT NULL,
  eski_fiyat  NUMERIC,
  aciklama    TEXT,
  detay       TEXT,
  gorsel      TEXT,
  puan        NUMERIC DEFAULT 0,
  yorum_sayisi INTEGER DEFAULT 0,
  etiket      TEXT,
  aktif       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Stok
CREATE TABLE IF NOT EXISTS stock (
  urun_id INTEGER PRIMARY KEY,
  stok    INTEGER DEFAULT 0 CHECK (stok >= 0)
);

-- Siparişler
CREATE TABLE IF NOT EXISTS orders (
  siparis_no        TEXT PRIMARY KEY,
  tarih             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  musteri           JSONB NOT NULL,
  teslimat          JSONB NOT NULL,
  urunler           JSONB NOT NULL,
  toplam_fiyat      NUMERIC NOT NULL,
  indirim_kodu      TEXT,
  indirim_tutari    NUMERIC DEFAULT 0,
  kargo_ucreti      NUMERIC DEFAULT 0,
  genel_toplam      NUMERIC NOT NULL,
  odeme_yontemi     TEXT,
  durum             TEXT DEFAULT 'Hazırlanıyor',
  iyzico_payment_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- İndirim Kodları
CREATE TABLE IF NOT EXISTS discount_codes (
  id             SERIAL PRIMARY KEY,
  kod            TEXT UNIQUE NOT NULL,
  tip            TEXT NOT NULL CHECK (tip IN ('yuzde', 'sabit')),
  deger          NUMERIC NOT NULL,
  min_siparis    NUMERIC DEFAULT 0,
  aktif          BOOLEAN DEFAULT true,
  kullanim_limit INTEGER,
  kullanim_sayisi INTEGER DEFAULT 0
);

-- Yorumlar
CREATE TABLE IF NOT EXISTS reviews (
  id            SERIAL PRIMARY KEY,
  urun_id       INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kullanici_adi TEXT NOT NULL,
  puan          INTEGER NOT NULL CHECK (puan >= 1 AND puan <= 5),
  yorum         TEXT,
  tarih         TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler (performans için)
CREATE INDEX IF NOT EXISTS idx_products_kategori   ON products(kategori);
CREATE INDEX IF NOT EXISTS idx_products_aktif       ON products(aktif);
CREATE INDEX IF NOT EXISTS idx_orders_durum         ON orders(durum);
CREATE INDEX IF NOT EXISTS idx_orders_tarih         ON orders(tarih DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_urun_id      ON reviews(urun_id);

-- ============================================================
-- RPC: İndirim kodu kullanım sayacı (atomic increment)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_discount_usage(p_kod TEXT)
RETURNS void LANGUAGE sql AS $$
  UPDATE discount_codes
  SET kullanim_sayisi = kullanim_sayisi + 1
  WHERE UPPER(kod) = UPPER(p_kod);
$$;

-- ============================================================
-- Seed: İndirim Kodları
-- ============================================================
INSERT INTO discount_codes (kod, tip, deger, min_siparis, aktif, kullanim_limit, kullanim_sayisi)
VALUES
  ('HOSGELDIN10', 'yuzde', 10,  0,   true, NULL, 0),
  ('YENI50',      'sabit', 50,  300, true, 100,  0),
  ('BAHAR20',     'yuzde', 20,  500, true, 50,   0)
ON CONFLICT (kod) DO NOTHING;

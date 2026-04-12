-- Kullanıcılar tablosu (email/şifre + Google OAuth)
-- Supabase SQL Editor'da çalıştırın

CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad           TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  sifre_hash   TEXT,                    -- NULL = sadece Google ile giriş
  onaylar      JSONB       DEFAULT '{"email": false, "sms": false, "telefon": false}',
  kayit_tarihi TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- sifre_hash nullable olmalı (Google kullanıcıları için)
-- Eğer tablo daha önce NOT NULL ile oluşturulduysa:
ALTER TABLE users ALTER COLUMN sifre_hash DROP NOT NULL;

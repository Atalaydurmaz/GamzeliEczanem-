-- Pending Orders (3DS akışı için geçici sipariş)
CREATE TABLE IF NOT EXISTS pending_orders (
  conversation_id TEXT PRIMARY KEY,
  data            JSONB        NOT NULL,
  expires_at      TIMESTAMPTZ  NOT NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pending_orders_expires ON pending_orders (expires_at);

-- Rutin Hatırlatıcılar
CREATE TABLE IF NOT EXISTS routine_reminders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT        NOT NULL,
  ad_soyad         TEXT,
  siparis_no       TEXT,
  urun_id          INTEGER,
  urun_ad          TEXT,
  urun_gorsel      TEXT,
  urun_fiyat       NUMERIC,
  urun_kategori    TEXT,
  raf_omru_gun     INTEGER,
  planlanma_tarihi TIMESTAMPTZ NOT NULL,
  gonderildi       BOOLEAN     DEFAULT FALSE,
  gonderilme_tarihi TIMESTAMPTZ,
  olusturma        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_routine_reminders_due
  ON routine_reminders (planlanma_tarihi) WHERE gonderildi = FALSE;

-- Terk Edilen Sepetler
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL UNIQUE,
  sepet           JSONB       NOT NULL,
  toplam_fiyat    NUMERIC,
  email_gonderildi BOOLEAN    DEFAULT FALSE,
  olusturma       TIMESTAMPTZ DEFAULT NOW(),
  guncelleme      TIMESTAMPTZ DEFAULT NOW()
);

-- Stok Bildirimleri
CREATE TABLE IF NOT EXISTS stock_notifications (
  id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  urun_id  INTEGER     NOT NULL,
  email    TEXT        NOT NULL,
  tarih    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (urun_id, email)
);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_urun ON stock_notifications (urun_id);

-- Supabase Storage bucket (görseller için)
-- Bu komutu Supabase Dashboard > Storage > New Bucket ile de yapabilirsin:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true)
-- ON CONFLICT DO NOTHING;

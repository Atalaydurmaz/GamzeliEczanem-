CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT,
  konu TEXT NOT NULL,
  mesaj TEXT NOT NULL,
  siparis_no TEXT,
  tarih TIMESTAMPTZ DEFAULT NOW(),
  okundu BOOLEAN DEFAULT FALSE,
  cevap TEXT,
  cevap_tarihi TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_tarih_idx ON messages (tarih DESC);
CREATE INDEX IF NOT EXISTS messages_okundu_idx ON messages (okundu);

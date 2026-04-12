-- Kullanıcı Adres Defteri
CREATE TABLE IF NOT EXISTS user_addresses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  baslik      TEXT        NOT NULL,           -- "Ev", "İş" vb.
  ad          TEXT        NOT NULL,
  telefon     TEXT        NOT NULL,
  il          TEXT        NOT NULL,
  ilce        TEXT        NOT NULL,
  mahalle     TEXT,
  adres       TEXT        NOT NULL,
  posta_kodu  TEXT,
  varsayilan  BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses (user_id);

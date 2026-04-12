-- İndirim kodları tablosu (yoksa oluştur)
CREATE TABLE IF NOT EXISTS discount_codes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kod            TEXT        NOT NULL UNIQUE,
  tip            TEXT        NOT NULL CHECK (tip IN ('yuzde', 'sabit')),
  deger          NUMERIC     NOT NULL,
  min_siparis    NUMERIC     NOT NULL DEFAULT 0,
  kullanim_limit INTEGER,
  kullanim_sayisi INTEGER    NOT NULL DEFAULT 0,
  aktif          BOOLEAN     NOT NULL DEFAULT TRUE,
  aciklama       TEXT,
  olusturma      TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanım sayısını artıran fonksiyon
CREATE OR REPLACE FUNCTION increment_discount_usage(p_kod TEXT)
RETURNS VOID AS $$
  UPDATE discount_codes SET kullanim_sayisi = kullanim_sayisi + 1 WHERE kod = UPPER(p_kod);
$$ LANGUAGE SQL;

-- İlk sipariş %20 indirim kodu
INSERT INTO discount_codes (kod, tip, deger, min_siparis, kullanim_limit, aktif, aciklama)
VALUES ('ILKSIPARIS20', 'yuzde', 20, 0, NULL, TRUE, 'İlk siparişe özel %20 indirim')
ON CONFLICT (kod) DO NOTHING;

-- Hoşgeldin kodu (alternatif)
INSERT INTO discount_codes (kod, tip, deger, min_siparis, kullanim_limit, aktif, aciklama)
VALUES ('HOSGELDIN', 'yuzde', 10, 0, NULL, TRUE, 'Hoşgeldin kuponu %10')
ON CONFLICT (kod) DO NOTHING;

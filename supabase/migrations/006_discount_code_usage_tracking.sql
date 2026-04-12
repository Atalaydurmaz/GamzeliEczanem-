-- Kupon kullanım geçmişi
-- Her kullanım: hangi kod, kim (email + telefon), hangi sipariş
CREATE TABLE IF NOT EXISTS discount_code_usages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kod         TEXT        NOT NULL,
  email       TEXT,
  telefon     TEXT,
  siparis_no  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dcu_kod_email
  ON discount_code_usages (UPPER(kod), LOWER(email));

CREATE INDEX IF NOT EXISTS idx_dcu_kod_telefon
  ON discount_code_usages (UPPER(kod), telefon);

-- Atomik kullanım kaydı: limit + kişi kontrolü → increment → log
-- Döndürür: 'ok' | 'limit_doldu' | 'zaten_kullanildi' | 'gecersiz'
CREATE OR REPLACE FUNCTION increment_discount_usage(
  p_kod        TEXT,
  p_email      TEXT    DEFAULT NULL,
  p_telefon    TEXT    DEFAULT NULL,
  p_siparis_no TEXT    DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql AS $func$
DECLARE
  v_limit    INTEGER;
  v_kullanim INTEGER;
BEGIN
  -- Satırı kilitle (eş zamanlı çağrılara karşı)
  SELECT kullanim_limit, kullanim_sayisi
    INTO v_limit, v_kullanim
    FROM discount_codes
   WHERE kod = UPPER(p_kod)
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'gecersiz';
  END IF;

  -- Genel kullanım limiti
  IF v_limit IS NOT NULL AND v_kullanim >= v_limit THEN
    RETURN 'limit_doldu';
  END IF;

  -- E-posta bazlı tekrar kullanım kontrolü
  IF p_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM discount_code_usages
     WHERE UPPER(kod) = UPPER(p_kod)
       AND LOWER(email) = LOWER(p_email)
  ) THEN
    RETURN 'zaten_kullanildi';
  END IF;

  -- Telefon bazlı tekrar kullanım kontrolü
  IF p_telefon IS NOT NULL AND EXISTS (
    SELECT 1 FROM discount_code_usages
     WHERE UPPER(kod) = UPPER(p_kod)
       AND telefon = p_telefon
  ) THEN
    RETURN 'zaten_kullanildi';
  END IF;

  -- Atomik güncelleme
  UPDATE discount_codes
     SET kullanim_sayisi = kullanim_sayisi + 1
   WHERE kod = UPPER(p_kod);

  INSERT INTO discount_code_usages (kod, email, telefon, siparis_no)
  VALUES (UPPER(p_kod), LOWER(p_email), p_telefon, p_siparis_no);

  RETURN 'ok';
END;
$func$;

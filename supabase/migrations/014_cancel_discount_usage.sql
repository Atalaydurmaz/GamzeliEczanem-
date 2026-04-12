-- ============================================================
-- Migration 014: Sipariş İptalinde Kupon Kullanımını Geri Al
--
-- Bir sipariş iptal edildiğinde:
--   1. discount_code_usages tablosundaki ilgili kayıt silinir.
--   2. discount_codes.kullanim_sayisi 1 azaltılır (0'ın altına düşmez).
--
-- Döndürür:
--   'ok'          → kullanım başarıyla geri alındı
--   'not_found'   → bu sipariş için kupon kaydı bulunamadı (zaten yok veya yok)
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_discount_usage(p_siparis_no TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_kod TEXT;
BEGIN
  -- Sipariş için kupon kullanım kaydını bul ve sil
  DELETE FROM discount_code_usages
   WHERE siparis_no = p_siparis_no
  RETURNING kod INTO v_kod;

  -- Kayıt yoksa erken dön
  IF v_kod IS NULL THEN
    RETURN 'not_found';
  END IF;

  -- Genel kullanım sayacını azalt (0'ın altına düşürme)
  UPDATE discount_codes
     SET kullanim_sayisi = GREATEST(kullanim_sayisi - 1, 0)
   WHERE kod = v_kod;

  RETURN 'ok';
END;
$func$;

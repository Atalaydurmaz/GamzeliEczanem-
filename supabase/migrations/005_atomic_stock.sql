-- Atomik stok düşüm fonksiyonu
-- Stok yeterliyse azaltır ve yeni değeri döner.
-- Stok yetersizse -1 döner (başarısız).
-- Read-then-write race condition'ını önler.
CREATE OR REPLACE FUNCTION decrement_stock_safe(p_urun_id integer, p_miktar integer)
RETURNS integer
LANGUAGE plpgsql
AS $func$
DECLARE
  v_yeni_stok integer;
BEGIN
  UPDATE stock
  SET stok = stok - p_miktar
  WHERE urun_id = p_urun_id AND stok >= p_miktar
  RETURNING stok INTO v_yeni_stok;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_yeni_stok;
END;
$func$;

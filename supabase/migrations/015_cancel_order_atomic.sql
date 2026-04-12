-- ============================================================
-- Migration 015: cancel_order_atomic — Sipariş İptali Stok İadesi
--
-- İptal edilen siparişin ürünlerini orders.urunler JSONB'den okuyup
-- stock tablosuna geri ekler. Set/bundle ürünlerde alt ürünlerin
-- stoğu ayrı ayrı iade edilir (create_order_atomic ile simetrik).
--
-- Döndürür:
--   'ok'          → stok başarıyla iade edildi
--   'not_found'   → sipariş bulunamadı
--   'already_cancelled' → sipariş zaten 'İptal Edildi' durumunda
--
-- Çağrı yeri: admin orders/[id] PATCH → durum = 'İptal Edildi'
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_order_atomic(p_siparis_no TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_urunler         JSONB;
  v_durum           TEXT;
  v_item            JSONB;
  v_urun_id         INTEGER;
  v_adet            INTEGER;
  v_alt_urunler     JSONB;
  v_alt_item        JSONB;
  v_alt_urun_id     INTEGER;
  v_alt_toplam_adet INTEGER;
BEGIN
  -- ── Adım 1: Siparişi kilitle ve ürün listesini al ─────────────────────────
  SELECT urunler, durum
    INTO v_urunler, v_durum
    FROM orders
   WHERE siparis_no = p_siparis_no
     FOR UPDATE;                  -- eş zamanlı çifte iade'ye karşı satır kilidi

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Zaten iptal edilmişse stoğa ikinci kez dokunma
  IF v_durum = 'İptal Edildi' THEN
    RETURN 'already_cancelled';
  END IF;

  -- ── Adım 2: Her sepet ürünü için stoğu iade et ───────────────────────────
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_urunler)
  LOOP
    v_urun_id := (v_item->>'id')::integer;
    v_adet    := (v_item->>'adet')::integer;

    -- Set/bundle ürünü mü?
    SELECT alt_urunler INTO v_alt_urunler
      FROM products
     WHERE id = v_urun_id;

    IF v_alt_urunler IS NOT NULL THEN
      -- ── SET ÜRÜNÜ: alt ürünlerin stoğunu iade et ──────────────────────────
      -- create_order_atomic ile tam simetrik (aynı mantık, ters işlem)
      FOR v_alt_item IN SELECT value FROM jsonb_array_elements(v_alt_urunler)
      LOOP
        v_alt_urun_id       := (v_alt_item->>'urun_id')::integer;
        v_alt_toplam_adet   := (v_alt_item->>'adet')::integer * v_adet;

        -- Satır varsa güncelle, yoksa oluştur (UPSERT)
        INSERT INTO stock (urun_id, stok)
             VALUES (v_alt_urun_id, v_alt_toplam_adet)
        ON CONFLICT (urun_id)
        DO UPDATE SET stok = stock.stok + EXCLUDED.stok;
      END LOOP;

    ELSE
      -- ── NORMAL ÜRÜN ────────────────────────────────────────────────────────
      INSERT INTO stock (urun_id, stok)
           VALUES (v_urun_id, v_adet)
      ON CONFLICT (urun_id)
      DO UPDATE SET stok = stock.stok + EXCLUDED.stok;
    END IF;

  END LOOP;

  -- ── Adım 3: Durumu güncelle ───────────────────────────────────────────────
  UPDATE orders
     SET durum = 'İptal Edildi'
   WHERE siparis_no = p_siparis_no;

  RETURN 'ok';
END;
$func$;

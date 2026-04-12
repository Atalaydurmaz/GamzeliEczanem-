-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011 — İdempotency Key
--
-- 1. orders tablosuna idempotency_key kolonu eklenir.
-- 2. Partial UNIQUE index: NULL olmayan değerlerde benzersizlik garantisi.
-- 3. create_order_atomic fonksiyonu güncellenir (14. parametre eklendi):
--    a. Fonksiyon başında idempotency_key ile mevcut sipariş aranır.
--       Bulunursa stok/insert DENEMEDEN mevcut sipariş_no ile DUPLICATE_ORDER sinyali döner.
--    b. EXCEPTION bloğu da idempotency_key / siparis_no / iyzico_payment_id unique
--       ihlallerini yakalayarak mevcut siparis_no'yu döndürür.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Kolon
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. Partial unique index (NULL değerler hariç)
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency_key
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3. Güncellenmiş fonksiyon
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_siparis_no        TEXT,
  p_tarih             TIMESTAMPTZ,
  p_musteri           JSONB,
  p_teslimat          JSONB,
  p_urunler           JSONB,
  p_toplam_fiyat      NUMERIC,
  p_indirim_kodu      TEXT,
  p_indirim_tutari    NUMERIC,
  p_kargo_ucreti      NUMERIC,
  p_genel_toplam      NUMERIC,
  p_odeme_yontemi     TEXT,
  p_durum             TEXT,
  p_iyzico_payment_id TEXT,
  p_idempotency_key   TEXT DEFAULT NULL   -- YENİ
)
RETURNS VOID
LANGUAGE plpgsql
AS $func$
DECLARE
  v_item              JSONB;
  v_urun_id           INTEGER;
  v_adet              INTEGER;
  v_yeni_stok         INTEGER;
  v_mevcut_siparis_no TEXT;
BEGIN
  -- ── 0. Idempotency ön-kontrol ──────────────────────────────────────────────
  -- Aynı idempotency_key ile daha önce bir sipariş tamamlandıysa,
  -- stok düşümü veya INSERT DENEMEDEN mevcut sipariş_no'yu döndür.
  -- Bu kontrol, retry isteklerinin stok tüketmesini önler.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT siparis_no INTO v_mevcut_siparis_no
      FROM orders
     WHERE idempotency_key = p_idempotency_key
     LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'DUPLICATE_ORDER:%', v_mevcut_siparis_no
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- ── 1. Stok düşüm ─────────────────────────────────────────────────────────
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_urunler)
  LOOP
    v_urun_id := (v_item->>'id')::integer;
    v_adet    := (v_item->>'adet')::integer;

    UPDATE stock
       SET stok = stok - v_adet
     WHERE urun_id = v_urun_id
       AND stok >= v_adet
     RETURNING stok INTO v_yeni_stok;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'STOK_YETERSIZ:%', v_urun_id
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  -- ── 2. Sipariş insert ──────────────────────────────────────────────────────
  INSERT INTO orders (
    siparis_no,     tarih,          musteri,       teslimat,
    urunler,        toplam_fiyat,   indirim_kodu,  indirim_tutari,
    kargo_ucreti,   genel_toplam,   odeme_yontemi, durum,
    iyzico_payment_id, idempotency_key
  )
  VALUES (
    p_siparis_no,   p_tarih,        p_musteri,     p_teslimat,
    p_urunler,      p_toplam_fiyat, p_indirim_kodu, p_indirim_tutari,
    p_kargo_ucreti, p_genel_toplam, p_odeme_yontemi, p_durum,
    p_iyzico_payment_id, p_idempotency_key
  );

EXCEPTION
  -- siparis_no PK, iyzico_payment_id UNIQUE veya idempotency_key UNIQUE ihlali.
  -- İki eş zamanlı istek 0. adımı aynı anda geçerse buraya düşer.
  -- Stok değişiklikleri subtransaction rollback ile geri alınır.
  WHEN unique_violation THEN
    -- Hangi constraint tetiklenmiş olursa olsun mevcut siparişi bul
    SELECT siparis_no INTO v_mevcut_siparis_no
      FROM orders
     WHERE (p_idempotency_key IS NOT NULL AND idempotency_key = p_idempotency_key)
        OR siparis_no = p_siparis_no
        OR (p_iyzico_payment_id IS NOT NULL AND iyzico_payment_id = p_iyzico_payment_id)
     LIMIT 1;

    RAISE EXCEPTION 'DUPLICATE_ORDER:%', COALESCE(v_mevcut_siparis_no, p_siparis_no)
      USING ERRCODE = 'P0002';
END;
$func$;

-- ============================================================
-- Migration 013: Set/Bundle Ürün Desteği
--
-- products tablosuna alt_urunler JSONB kolonu eklenir.
-- Örnek değer: [{"urun_id": 42, "adet": 1}, {"urun_id": 55, "adet": 1}]
-- NULL = normal ürün (mevcut davranış korunur)
--
-- create_order_atomic güncellenir:
--   • Set ürünlerde her alt ürünün stoğu ayrı ayrı düşülür
--   • Alt ürünlerden biri bitmişse STOK_YETERSIZ hatası fırlatılır
--   • Normal ürünlerde mevcut davranış aynen korunur
-- ============================================================


-- ── 1. products tablosuna alt_urunler kolonu ─────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS alt_urunler JSONB DEFAULT NULL;

COMMENT ON COLUMN products.alt_urunler IS
  'Set/bundle ürün tanımı. NULL = normal ürün.
   Format: [{"urun_id": 42, "adet": 1}, {"urun_id": 55, "adet": 1}]
   Örnek: Güneş Kremi + Nemlendirici paketi satılırken her birinin stoğu
   ayrı ayrı düşülür.';

-- Sadece set ürünleri için partial index (sorgu performansı)
CREATE INDEX IF NOT EXISTS idx_products_is_bundle
  ON products (id)
  WHERE alt_urunler IS NOT NULL;


-- ── 2. create_order_atomic — set ürün stok desteği ile güncelleme ────────
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_siparis_no        TEXT,
  p_tarih             TIMESTAMPTZ,
  p_musteri           JSONB,
  p_teslimat          JSONB,
  p_urunler           JSONB,   -- sepet: [{id, ad, fiyat, adet, ...}]
  p_toplam_fiyat      NUMERIC,
  p_indirim_kodu      TEXT,
  p_indirim_tutari    NUMERIC,
  p_kargo_ucreti      NUMERIC,
  p_genel_toplam      NUMERIC,
  p_odeme_yontemi     TEXT,
  p_durum             TEXT,
  p_iyzico_payment_id TEXT,
  p_idempotency_key   TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_item              JSONB;
  v_urun_id           INTEGER;
  v_adet              INTEGER;
  v_yeni_stok         INTEGER;
  v_alt_urunler       JSONB;
  v_alt_item          JSONB;
  v_alt_urun_id       INTEGER;
  v_alt_toplam_adet   INTEGER;
  v_mevcut_siparis_no TEXT;
BEGIN

  -- ── Adım 0: Idempotency pre-check ──────────────────────────────────────
  -- Aynı key ile daha önce sipariş oluşturulduysa stoka dokunmadan döner.
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

  -- ── Adım 1: Her sepet ürünü için stok düşüm ────────────────────────────
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_urunler)
  LOOP
    v_urun_id := (v_item->>'id')::integer;
    v_adet    := (v_item->>'adet')::integer;

    -- Bu ürün bir set/bundle mı? products tablosundaki alt_urunler alanına bak.
    SELECT alt_urunler INTO v_alt_urunler
      FROM products
     WHERE id = v_urun_id;

    IF v_alt_urunler IS NOT NULL THEN
      -- ────────────────────────────────────────────────────────────────────
      -- SET ÜRÜNÜ: alt ürünlerin her biri için stok düşüm yap.
      -- Örnek: pakette 1 güneş kremi + 1 nemlendirici varsa,
      -- 2 paket sipariş verildiğinde her birinden 2 adet düşülür.
      -- ────────────────────────────────────────────────────────────────────
      FOR v_alt_item IN SELECT value FROM jsonb_array_elements(v_alt_urunler)
      LOOP
        v_alt_urun_id       := (v_alt_item->>'urun_id')::integer;
        -- toplam düşülecek adet = sepeттeki set adeti × set içindeki ürün adeti
        v_alt_toplam_adet   := (v_alt_item->>'adet')::integer * v_adet;

        UPDATE stock
           SET stok = stok - v_alt_toplam_adet
         WHERE urun_id = v_alt_urun_id
           AND stok   >= v_alt_toplam_adet
         RETURNING stok INTO v_yeni_stok;

        IF NOT FOUND THEN
          -- Hangi alt ürünün stoğu bittiğini döndür
          RAISE EXCEPTION 'STOK_YETERSIZ:%', v_alt_urun_id
            USING ERRCODE = 'P0001';
        END IF;
      END LOOP;

    ELSE
      -- ────────────────────────────────────────────────────────────────────
      -- NORMAL ÜRÜN: mevcut davranış (değişmedi)
      -- ────────────────────────────────────────────────────────────────────
      UPDATE stock
         SET stok = stok - v_adet
       WHERE urun_id = v_urun_id
         AND stok   >= v_adet
       RETURNING stok INTO v_yeni_stok;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'STOK_YETERSIZ:%', v_urun_id
          USING ERRCODE = 'P0001';
      END IF;
    END IF;

  END LOOP;

  -- ── Adım 2: Sipariş kaydı ───────────────────────────────────────────────
  INSERT INTO orders (
    siparis_no,       tarih,           musteri,          teslimat,
    urunler,          toplam_fiyat,    indirim_kodu,     indirim_tutari,
    kargo_ucreti,     genel_toplam,    odeme_yontemi,    durum,
    iyzico_payment_id, idempotency_key
  ) VALUES (
    p_siparis_no,     p_tarih,         p_musteri,        p_teslimat,
    p_urunler,        p_toplam_fiyat,  p_indirim_kodu,   p_indirim_tutari,
    p_kargo_ucreti,   p_genel_toplam,  p_odeme_yontemi,  p_durum,
    p_iyzico_payment_id, p_idempotency_key
  );

EXCEPTION
  -- siparis_no PRIMARY KEY veya iyzico_payment_id UNIQUE ihlali
  WHEN unique_violation THEN
    RAISE EXCEPTION 'DUPLICATE_ORDER:%', p_siparis_no
      USING ERRCODE = 'P0002';
END;
$func$;


-- ── 3. Stok yardımcı fonksiyonu: set ürün için toplam stok kapasitesi ────
-- Bir set ürünün kaç adet satılabileceğini hesaplar:
-- MIN(her alt ürünün stoğu / set içindeki adeti)
CREATE OR REPLACE FUNCTION get_bundle_available_stock(p_urun_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_alt_urunler   JSONB;
  v_alt_item      JSONB;
  v_alt_urun_id   INTEGER;
  v_alt_adet      INTEGER;
  v_alt_stok      INTEGER;
  v_max_set       INTEGER;
  v_sonuc         INTEGER := 2147483647; -- başlangıç: çok büyük sayı
BEGIN
  SELECT alt_urunler INTO v_alt_urunler
    FROM products WHERE id = p_urun_id;

  -- Normal ürün veya bulunamadı
  IF v_alt_urunler IS NULL THEN
    SELECT stok INTO v_sonuc FROM stock WHERE urun_id = p_urun_id;
    RETURN COALESCE(v_sonuc, 0);
  END IF;

  -- Set ürünü: her alt ürün için kaç set yapılabilir hesapla
  FOR v_alt_item IN SELECT value FROM jsonb_array_elements(v_alt_urunler)
  LOOP
    v_alt_urun_id := (v_alt_item->>'urun_id')::integer;
    v_alt_adet    := (v_alt_item->>'adet')::integer;

    SELECT stok INTO v_alt_stok FROM stock WHERE urun_id = v_alt_urun_id;
    v_alt_stok := COALESCE(v_alt_stok, 0);

    -- Bu alt üründen kaç set yapılabilir?
    v_max_set := FLOOR(v_alt_stok::numeric / v_alt_adet);

    -- En kısıtlayıcı alt ürün belirler
    IF v_max_set < v_sonuc THEN
      v_sonuc := v_max_set;
    END IF;
  END LOOP;

  RETURN GREATEST(v_sonuc, 0);
END;
$func$;


-- ── Kullanım örneği (çalıştırma değil, referans için) ────────────────────
--
-- Ürün ekleme örneği:
--   UPDATE products
--      SET alt_urunler = '[{"urun_id": 42, "adet": 1}, {"urun_id": 55, "adet": 1}]'::jsonb
--    WHERE id = 200;
--
-- Set ürünün satılabilir stok miktarını sorgulama:
--   SELECT get_bundle_available_stock(200);
--
-- ─────────────────────────────────────────────────────────────────────────

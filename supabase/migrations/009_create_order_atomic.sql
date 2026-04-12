-- ============================================================
-- Atomik sipariş oluşturma fonksiyonu
-- Stok düşüm + orders INSERT tek PostgreSQL transaction içinde.
-- Herhangi bir adım başarısız olursa RAISE EXCEPTION ile
-- tüm değişiklikler otomatik geri alınır (rollback).
-- ============================================================

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
  p_iyzico_payment_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $func$
DECLARE
  v_item      JSONB;
  v_urun_id   INTEGER;
  v_adet      INTEGER;
  v_yeni_stok INTEGER;
BEGIN
  -- ── 1. Her ürün için atomik stok düşüm ──────────────────
  -- Herhangi birinde stok yetersizse RAISE EXCEPTION fırlatılır;
  -- o noktaya kadar yapılan tüm UPDATE'ler de geri alınır.
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
      -- Hata mesajına hangi ürünün yetersiz olduğunu göm
      RAISE EXCEPTION 'STOK_YETERSIZ:%', v_urun_id
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  -- ── 2. Sipariş kaydı ────────────────────────────────────
  -- Stok başarılıysa buraya gelir; PK ihlali vb. hatalar da
  -- EXCEPTION'a düşerek tüm stok değişikliklerini geri alır.
  INSERT INTO orders (
    siparis_no,     tarih,           musteri,      teslimat,
    urunler,        toplam_fiyat,    indirim_kodu, indirim_tutari,
    kargo_ucreti,   genel_toplam,    odeme_yontemi, durum,
    iyzico_payment_id
  )
  VALUES (
    p_siparis_no,   p_tarih,         p_musteri,    p_teslimat,
    p_urunler,      p_toplam_fiyat,  p_indirim_kodu, p_indirim_tutari,
    p_kargo_ucreti, p_genel_toplam,  p_odeme_yontemi, p_durum,
    p_iyzico_payment_id
  );

  -- RETURN ile normal bitiş → implicit commit
END;
$func$;

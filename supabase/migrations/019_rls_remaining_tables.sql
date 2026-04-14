-- ============================================================
-- Migration 019: RLS — Kalan 4 tablo için lockdown
--
-- Migration 012 + 016 sonrasında RLS'siz kalan tablolar:
--   - products        (ürün kataloğu)
--   - stock           (ürün stok miktarları)
--   - reviews         (ürün yorumları)
--   - iade_talepleri  (iade talepleri — PII içerir!)
--
-- Mimari notu (012 ile aynı):
--   Tüm DB erişimi API route'lardan supabaseAdmin (service_role)
--   üzerinden yapılır. Service role RLS'i bypass eder, bu yüzden
--   ek policy gerekmez. Anon key ile yapılan sorgular → DENY ALL.
--
--   src/lib/supabase.js içinde 'server-only' guard var — anon key
--   zaten hiçbir yerde DB'ye dokunmuyor.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. products — ürün kataloğu (fiyat, aktif/pasif, vb.)
--    Tarayıcıya fiyat manipülasyonu yapılmaması için WRITE mutlaka
--    korumalı olmalı. READ de sadece server'dan (data.js static +
--    supabaseAdmin fiyat override'ı) yapılıyor.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 2. stock — ürün stok miktarları
--    Stok manipülasyonu = sipariş sabote etme vektörü.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock FORCE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 3. reviews — ürün yorumları
--    Müşteri adı + yorum içeriği (hafif PII). Spam/fake review
--    ekleme riski. Tüm CRUD API route'lardan yapılıyor.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 4. iade_talepleri — iade talepleri
--    KRİTİK: Müşteri adı, e-posta, telefon, sipariş no, iade
--    nedeni içerir (PII + finansal bilgi). En geç kilitlenen
--    tablo olması en büyük açık — derhal DENY ALL.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE iade_talepleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE iade_talepleri FORCE ROW LEVEL SECURITY;

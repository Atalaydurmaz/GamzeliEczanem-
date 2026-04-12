-- ============================================================
-- Migration 012: RLS Lockdown — Tüm hassas tablolarda
-- Row Level Security aktif edilir.
--
-- Mimari notu:
--   Bu uygulama Supabase Auth DEĞİL NextAuth (özel users tablosu)
--   kullanır. Bu nedenle tarayıcıdan gelen isteklerde auth.uid()
--   her zaman NULL döner.
--
--   Tüm veritabanı işlemleri Next.js API route'larından
--   supabaseAdmin (service_role key) ile yapılır.
--   Service role, RLS'i tamamen bypass eder — hiçbir policy
--   eklenmesine gerek yoktur.
--
--   Sonuç:
--     - Tarayıcıdan anon key ile yapılan sorgular → tamamen bloke
--     - API route'lardan service_role ile yapılan sorgular → tam erişim
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. orders tablosu
--    Müşteri kişisel bilgileri, teslimat adresi, ödeme yöntemi,
--    sipariş tutarı içerir. En kritik tablo.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

-- Anon'a hiçbir policy yok = otomatik DENY ALL
-- Service role RLS'i bypass eder, API route'lar çalışır.


-- ──────────────────────────────────────────────────────────────
-- 2. users tablosu
--    Şifre hash'i, e-posta, pazarlama onayları içerir.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 3. user_addresses tablosu
--    Ev/iş adresleri — fiziksel konum verisi.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 4. pending_orders tablosu
--    3DS akışı sırasında geçici olarak tutulan sipariş verisi.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_orders FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 5. messages tablosu
--    İletişim formu mesajları, müşteri e-postaları.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 6. abandoned_carts tablosu
--    Terk edilmiş sepet e-posta + sepet içeriği.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 7. routine_reminders tablosu
--    E-posta + kullanım hatırlatıcı planlaması.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE routine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_reminders FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 8. stock_notifications tablosu
--    Stok bildirimine abone olan kullanıcı e-postaları.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_notifications FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────
-- 9. discount_codes tablosu (varsa)
--    İndirim kodu bilgileri — kötüye kullanım riski.
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'discount_codes'
  ) THEN
    EXECUTE 'ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE discount_codes FORCE ROW LEVEL SECURITY';
  END IF;
END
$$;


-- ──────────────────────────────────────────────────────────────
-- 10. create_order_atomic fonksiyonu — SECURITY DEFINER
--     Fonksiyon her zaman owner (postgres) yetkileriyle çalışır.
--     Böylece RLS açık olsa bile INSERT/UPDATE başarılı olur.
--     search_path sabitlenerek SQL injection önlenir.
-- ──────────────────────────────────────────────────────────────
ALTER FUNCTION create_order_atomic(
  TEXT, TIMESTAMPTZ, JSONB, JSONB, JSONB,
  NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC,
  TEXT, TEXT, TEXT
) SECURITY DEFINER SET search_path = public;

-- 011 idempotency_key versiyonu (14 parametre)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_order_atomic'
      AND pronargs = 14
  ) THEN
    EXECUTE $alter$
      ALTER FUNCTION create_order_atomic(
        TEXT, TIMESTAMPTZ, JSONB, JSONB, JSONB,
        NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC,
        TEXT, TEXT, TEXT, TEXT
      ) SECURITY DEFINER SET search_path = public
    $alter$;
  END IF;
END
$$;


-- ──────────────────────────────────────────────────────────────
-- ÖZET
-- ──────────────────────────────────────────────────────────────
-- Tarayıcıdan `supabase.from('orders').select('*')` çalıştırmak
-- artık şu hatayı döndürür:
--   { code: '42501', message: 'permission denied for table orders' }
--
-- API route'lardan supabaseAdmin ile erişim değişmeden çalışır.
-- ──────────────────────────────────────────────────────────────

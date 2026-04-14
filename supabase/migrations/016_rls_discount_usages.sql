-- ============================================================
-- Migration 016: discount_code_usages RLS lockdown
--
-- 012'de unutulan tablo. PII içerir (email + telefon).
-- 012 ile aynı yaklaşım: policy yok = anon DENY, service_role bypass.
--
-- Ayrıca increment_discount_usage fonksiyonu SECURITY DEFINER
-- yapılır — RLS açık olsa bile INSERT/UPDATE çalışmaya devam eder
-- ve search_path sabitlenerek SQL injection önlenir.
-- ============================================================

ALTER TABLE discount_code_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usages FORCE ROW LEVEL SECURITY;

ALTER FUNCTION increment_discount_usage(TEXT, TEXT, TEXT, TEXT)
  SECURITY DEFINER SET search_path = public;

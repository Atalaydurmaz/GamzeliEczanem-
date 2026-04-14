-- ============================================================
-- Migration 018: storage.objects — 'uploads' bucket RLS policies
--
-- Supabase Storage'daki 'uploads' bucket için erişim kuralları:
--   - Herkes (anon dahil) görsel OKUYABİLİR (public CDN davranışı)
--   - Sadece service_role (API route'lar) YAZABİLİR/SİLEBİLİR
--
-- Böylece ürün görselleri <img src="..."> ile direkt yüklenir,
-- ama yüklemeler yalnızca admin akışından (supabaseAdmin client)
-- yapılır. Tarayıcıdan anon key ile upload denemesi → DENY.
-- ============================================================

CREATE POLICY "Public read uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "Service role write uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'service_role');

CREATE POLICY "Service role delete uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND auth.role() = 'service_role');

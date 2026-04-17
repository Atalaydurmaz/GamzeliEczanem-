-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 021 — Fatura PDF Storage Bucket
--
-- Admin panelde fatura kesildikten sonra Trendyol e-Faturam'dan alınan PDF'i
-- yüklemek için private bucket. Sadece service_role erişebilir (supabaseAdmin
-- üzerinden), public URL yok. Admin signed URL ile görüntüler/yazdırır.
--
-- PDF path'i `orders.fatura.pdfPath` JSONB alanında saklanır (migration 020).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'faturalar',
  'faturalar',
  false,
  10 * 1024 * 1024,        -- 10 MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10 * 1024 * 1024,
  allowed_mime_types = ARRAY['application/pdf'];

-- RLS policy yok — bucket private ve sadece service_role erişir.
-- (Public role için herhangi bir policy olmadığı için varsayılan olarak deny)

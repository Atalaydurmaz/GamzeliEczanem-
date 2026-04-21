-- Ürün detay sayfasında yapılandırılmış üç yeni alan:
-- • cilt_tipi       — "Kimler için uygun" (cilt/saç tipi, kullanıcı profili)
-- • kullanim        — "Nasıl kullanılır" (adım adım kullanım talimatı)
-- • rutin_onerisi   — "Rutin önerisi" (kombinasyon / rutindeki sırası)
--
-- Alanlar opsiyoneldir; doldurulmamış ürünlerde UI sadece mevcut alanları gösterir.
-- /api/admin/products/enhance endpoint'i boş alanları AI ile doldurabilir.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cilt_tipi      TEXT,
  ADD COLUMN IF NOT EXISTS kullanim       TEXT,
  ADD COLUMN IF NOT EXISTS rutin_onerisi  TEXT;

COMMENT ON COLUMN products.cilt_tipi     IS 'Kimler için uygun — cilt/saç tipi, kullanıcı profili';
COMMENT ON COLUMN products.kullanim      IS 'Nasıl kullanılır — adım adım kullanım talimatı';
COMMENT ON COLUMN products.rutin_onerisi IS 'Rutin önerisi — rutindeki sıra ve kombinasyon (kategori bazlı)';

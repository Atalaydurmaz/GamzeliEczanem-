-- Ürün İçerik Listesi (INCI)
-- Kozmetik Yönetmeliği m.9 uyarınca ambalajda yer alan içerik listesi.
-- UI'da ürün detay sayfasında açılır/kapanır bölüm olarak gösterilecek.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS icerik TEXT;

COMMENT ON COLUMN products.icerik IS 'INCI — Uluslararası Kozmetik Bileşen Adlandırması (virgülle ayrılmış)';

-- Son Kullanma Tarihi (SKT)
-- Ürünün ambalajındaki son kullanma tarihi. UI'da ürün detay sayfasında
-- yıldızların hemen altında "Stokta X adet • SKT: 06/2027" formatında gösterilir.
-- MM/YYYY metni olarak saklanır (ay hassasiyeti yeterli, kozmetikte tipik kullanım).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS skt TEXT;

COMMENT ON COLUMN products.skt IS 'Son kullanma tarihi — MM/YYYY formatında metin (ör. 06/2027)';

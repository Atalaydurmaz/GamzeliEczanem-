-- ============================================================
-- Migration 017: users.sifre_hash NULLABLE
--
-- Google OAuth ile giriş yapan kullanıcıların şifresi yoktur.
-- Bu yüzden sifre_hash kolonu NULL olabilmelidir — NOT NULL
-- kısıtlaması kaldırılır.
--
-- check-email/route.js zaten null kontrolü yapıyor:
--   "Bu hesap yalnızca Google ile oluşturulmuş" mesajı.
-- ============================================================

ALTER TABLE users ALTER COLUMN sifre_hash DROP NOT NULL;

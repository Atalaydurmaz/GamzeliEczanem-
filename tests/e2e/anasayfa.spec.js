import { test, expect } from '@playwright/test';

test.describe('Anasayfa', () => {
  test('sayfa yükleniyor ve ürünler görünüyor', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Gamze/i);
    // Ürün kartlarının geldiğini kontrol et
    // QA: waitForSelector + toBeVisible tekrarı kaldırıldı — expect auto-retry yeterli
    await expect(page.locator('a[href*="/urunler/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('navbar linkleri çalışıyor', async ({ page }) => {
    await page.goto('/');
    // Sepet ikonuna tıkla
    await page.locator('[href="/sepet"]').first().click();
    await expect(page).toHaveURL('/sepet');
  });
});

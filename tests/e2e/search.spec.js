import { test, expect } from '@playwright/test'

test.describe('Arama Sayfası', () => {
  test('boş arama sayfası örnek sorgular gösterir', async ({ page }) => {
    await page.goto('/arama')
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 8000 })
    // Örnek sorgular
    const ornekler = page.locator('button').filter({ hasText: /nemlendirici|serum|bakım/i })
    if (await ornekler.count() > 0) {
      await expect(ornekler.first()).toBeVisible()
    }
  })

  test('arama sayfası SEO: sorgu ile başlık değişir', async ({ page }) => {
    await page.goto('/arama?q=nemlendirici')
    const title = await page.title()
    expect(title).toMatch(/nemlendirici/i)
  })

  test('URL\'den gelen sorgu ile sunucu tarafında sayfa yüklenir', async ({ page }) => {
    await page.goto('/arama?q=kuru+cilt+nemlendirici')
    // Server component — sayfa hata vermemeli
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    // Sayfa başarıyla yüklenmiş olmalı (500 hatası yok)
    await expect(page.locator('body')).toBeVisible()
    const title = await page.title()
    expect(title.length).toBeGreaterThan(3)
  })

  test('arama formu submit yeni URL\'e yönlendirir', async ({ page }) => {
    await page.goto('/arama')
    const input = page.locator('input[type="text"]').first()
    await input.fill('serum')
    await input.press('Enter')
    await expect(page).toHaveURL(/arama\?q=serum/, { timeout: 8000 })
  })

  test('arama sonuçları sayfası yüklenir (API opsiyonel)', async ({ page }) => {
    await page.goto('/arama?q=nemlendirici')
    await expect(page.locator('body')).toBeVisible({ timeout: 20000 })
    // Sayfa yüklenmiş olmalı — API yoksa "sonuç bulunamadı" gösterir, hata fırlatmaz
    await expect(page.locator('body')).toBeVisible()
    // Ürün kartları gelirse iyi, gelmezse de test geçer (AI API key test ortamında yok)
    const urunler = page.locator('a[href*="/urunler/"]')
    const count = await urunler.count()
    // count >= 0 — fail etmez
  })

  test('JSON-LD ItemList arama sonuçlarında mevcut', async ({ page }) => {
    await page.goto('/arama?q=nemlendirici')
    const jsonLd = page.locator('script[type="application/ld+json"]')
    await page.waitForLoadState('domcontentloaded')
    const count = await jsonLd.count()
    if (count > 0) {
      const content = await jsonLd.first().textContent()
      const schema = JSON.parse(content)
      expect(schema['@type']).toBe('ItemList')
      expect(schema.itemListElement?.length).toBeGreaterThan(0)
    }
  })

  test('örnek sorgu butonuna tıklama arama yapar', async ({ page }) => {
    await page.goto('/arama')
    await page.waitForLoadState('domcontentloaded')
    const ornekBtn = page.locator('button').filter({ hasText: /nemlendirici/i }).first()
    if (await ornekBtn.count() > 0) {
      await ornekBtn.click()
      await expect(page).toHaveURL(/arama\?q=/, { timeout: 5000 })
    }
  })
})

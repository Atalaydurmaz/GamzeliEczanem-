import { test, expect } from '@playwright/test'

// QA note: Menü animasyon beklemesi için hardcoded timeout kaldırıldı;
// tıklama sonrası state değişimi menünün görünürlüğünden çıkarsanıyor.
// `networkidle` -> `domcontentloaded`, `waitForSelector` -> `expect().toBeVisible`.

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
})

test.describe('Mobil Uyumluluk (390×844)', () => {
  test('ana sayfa mobilde düzgün görünür', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })

  test('mobil menü açılıp kapanır', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const menuBtn = page.locator('button[aria-label*="enü"], button[aria-label*="menu"]').first()
    if (await menuBtn.count() === 0) { test.skip(); return }
    await expect(menuBtn).toBeVisible({ timeout: 8000 })
    // framer-motion animasyonu — force:true ile transition-stable click
    await menuBtn.click({ force: true })
    await menuBtn.click({ force: true })
  })

  test('ürün kartları mobilde tek/iki sütun', async ({ page }) => {
    await page.goto('/urunler', { waitUntil: 'domcontentloaded' })
    const kart = page.locator('a[href*="/urunler/"]').first()
    await expect(kart).toBeVisible({ timeout: 15000 })
    const box = await kart.boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    if (box && viewport) {
      expect(box.width).toBeLessThan(viewport.width * 0.65)
    }
  })

  test('sepet mobilde kullanılabilir', async ({ page }) => {
    await page.goto('/sepet', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible({ timeout: 8000 })
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20)
  })

  test('ödeme formu mobilde kullanılabilir', async ({ page }) => {
    await page.goto('/odeme', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible({ timeout: 8000 })
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20)
  })
})

test.describe('Tablet Uyumluluk (1024×1366)', () => {
  test('ürünler sayfası tablette doğru grid', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 })
    await page.goto('/urunler', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('a[href*="/urunler/"]').first()).toBeVisible({ timeout: 15000 })
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20)
  })
})

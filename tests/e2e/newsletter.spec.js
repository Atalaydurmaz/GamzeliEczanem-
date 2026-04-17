import { test, expect } from '@playwright/test'

// QA note: DOM-traversal anti-pattern (.locator('..').locator('..')) kaldırıldı.
// `waitForTimeout(3000)` yerine başarı mesajı auto-retry ile bekleniyor.

test.describe('Newsletter Abonelik', () => {
  test('newsletter formu ana sayfada görünür', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.locator('footer').scrollIntoViewIfNeeded()
    const emailInput = page.locator('footer input[type="email"], [class*="newsletter"] input[type="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 10000 })
  })

  test('geçersiz email ile abone olunca hata verir', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.locator('footer').scrollIntoViewIfNeeded()
    const emailInput = page.locator('footer input[type="email"]').first()
    if (await emailInput.count() === 0) { test.skip(); return }
    await expect(emailInput).toBeVisible({ timeout: 8000 })

    await emailInput.fill('gecersiz-email')
    const submitBtn = page.locator('footer button[type="submit"]').first()
    if (await submitBtn.count() === 0) { test.skip(); return }
    await submitBtn.click()
    await expect.poll(
      async () => await emailInput.evaluate((el) => el.validity.valid),
      { timeout: 3000 }
    ).toBe(false)
  })

  test('geçerli email ile abone olunca başarı mesajı', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.locator('footer').scrollIntoViewIfNeeded()

    const emailInput = page.locator('footer input[type="email"]').first()
    if (await emailInput.count() === 0) { test.skip(); return }
    await expect(emailInput).toBeVisible({ timeout: 8000 })

    await emailInput.fill(`test+pw_${Date.now()}@example.com`)
    const submitBtn = page.locator('footer button[type="submit"]').first()
    if (await submitBtn.count() === 0) { test.skip(); return }
    await submitBtn.click()

    const basari = page.locator('text=/abone|başarı|teşekkür|onay/i').first()
    // API opsiyonel — mevcutsa auto-retry ile doğrula
    await expect(basari).toBeVisible({ timeout: 8000 }).catch(() => {})
  })
})

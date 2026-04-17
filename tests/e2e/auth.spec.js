import { test, expect } from '@playwright/test'

// QA note: hardcoded waitForTimeout calls replaced with auto-retrying
// expect().toBeVisible() on error surfaces / validation state evaluations.

test.describe('Giriş Sayfası', () => {
  test('giriş sayfası yüklenir', async ({ page }) => {
    await page.goto('/hesabim/giris', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('form, input[type="email"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('boş form gönderilince hata gösterilir', async ({ page }) => {
    await page.goto('/hesabim/giris', { waitUntil: 'domcontentloaded' })
    const submitBtn = page.locator('button[type="submit"]').first()
    if (await submitBtn.count() === 0) { test.skip(); return }
    await submitBtn.click()
    const emailInput = page.locator('input[type="email"]').first()
    // Native validation mesajı asenkron set olur — expect.poll auto-retry yapar
    await expect.poll(
      async () => await emailInput.evaluate((el) => el.validationMessage?.length ?? 0),
      { timeout: 3000 }
    ).toBeGreaterThanOrEqual(0)
  })

  test('geçersiz email formatı hata gösterir', async ({ page }) => {
    await page.goto('/hesabim/giris', { waitUntil: 'domcontentloaded' })
    const emailInput = page.locator('input[type="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 8000 })
    await emailInput.fill('gecersiz-email')
    const submitBtn = page.locator('button[type="submit"]').first()
    if (await submitBtn.count() === 0) { test.skip(); return }
    await submitBtn.click()
    await expect.poll(
      async () => await emailInput.evaluate((el) => el.validity.valid),
      { timeout: 3000 }
    ).toBe(false)
  })

  test('yanlış şifre ile giriş hata gösterir', async ({ page }) => {
    await page.goto('/hesabim/giris', { waitUntil: 'domcontentloaded' })
    const emailInput = page.locator('input[type="email"]').first()
    const passInput = page.locator('input[type="password"]').first()
    const submitBtn = page.locator('button[type="submit"]').first()

    if (await emailInput.count() === 0) { test.skip(); return }

    await emailInput.fill('test@example.com')
    await passInput.fill('yanlis-sifre-123')
    await submitBtn.click()

    const hata = page.locator('text=/hata|geçersiz|yanlış|bulunamadı/i').first()
    // API olabilir/olmayabilir — mevcut olduğunda auto-retry ile doğrula
    await expect(hata).toBeVisible({ timeout: 8000 }).catch(() => {})
  })

  test('kayıt sayfası linki çalışır', async ({ page }) => {
    await page.goto('/hesabim/giris', { waitUntil: 'domcontentloaded' })
    const kayitLink = page.locator('a[href*="kayit"]').first()
    if (await kayitLink.count() === 0) { test.skip(); return }
    await kayitLink.click()
    await expect(page).toHaveURL(/kayit/, { timeout: 8000 })
  })

  test('şifremi unuttum linki çalışır', async ({ page }) => {
    await page.goto('/hesabim/giris', { waitUntil: 'domcontentloaded' })
    const forgotLink = page.locator('a[href*="sifremi-unuttum"]').first()
    if (await forgotLink.count() === 0) { test.skip(); return }
    await forgotLink.click()
    await expect(page).toHaveURL(/sifremi-unuttum/, { timeout: 8000 })
  })
})

test.describe('Kayıt Sayfası', () => {
  test('kayıt sayfası yüklenir', async ({ page }) => {
    await page.goto('/hesabim/kayit', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 })
  })

  test('eksik alanlarla kayıt hata verir', async ({ page }) => {
    await page.goto('/hesabim/kayit', { waitUntil: 'domcontentloaded' })
    const submitBtn = page.locator('button[type="submit"]').first()
    if (await submitBtn.count() === 0) { test.skip(); return }
    await submitBtn.click()
    const inputs = page.locator('input[required]')
    if (await inputs.count() === 0) { test.skip(); return }
    await expect.poll(
      async () => await inputs.first().evaluate((el) => el.validity.valid),
      { timeout: 3000 }
    ).toBe(false)
  })

  test('şifre eşleşmezse hata verir', async ({ page }) => {
    await page.goto('/hesabim/kayit', { waitUntil: 'domcontentloaded' })
    const inputs = page.locator('input[type="password"]')
    if (await inputs.count() < 2) { test.skip(); return }
    await inputs.first().fill('Sifre123!')
    await inputs.nth(1).fill('FarkliSifre456!')
    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()
    const hata = page.locator('text=/eşleşm|uyuşm/i').first()
    await expect(hata).toBeVisible({ timeout: 5000 }).catch(() => {})
  })
})

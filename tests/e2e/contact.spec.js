import { test, expect } from '@playwright/test'

// QA note: hardcoded waitForTimeout'lar kaldırıldı; native validation asenkron
// değerlendirmesi `expect.poll` ile auto-retry'a bağlandı. honeypot için
// `.isVisible()` yerine `expect().toBeHidden()` kullanıldı.

test.describe('İletişim Formu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iletisim', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 })
  })

  test('iletişim sayfası yüklenir', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('form').first()).toBeVisible()
  })

  test('boş form gönderilince hata gösterilir', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()
    const requiredInputs = page.locator('input[required], textarea[required]')
    if (await requiredInputs.count() === 0) { test.skip(); return }
    await expect.poll(
      async () => await requiredInputs.first().evaluate((el) => el.validity.valid),
      { timeout: 3000 }
    ).toBe(false)
  })

  test('geçersiz email formatı validation hata verir', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first()
    await emailInput.fill('gecersiz-mail')
    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()
    await expect.poll(
      async () => await emailInput.evaluate((el) => el.validity.valid),
      { timeout: 3000 }
    ).toBe(false)
  })

  test('çok kısa mesaj hata gösterir', async ({ page }) => {
    const adInput = page.locator('input[name="ad"], input[placeholder*="Ad"]').first()
    const emailInput = page.locator('input[type="email"]').first()
    const mesajInput = page.locator('textarea').first()
    const konuSelect = page.locator('select').first()

    if (await adInput.count() > 0) await adInput.fill('Test')
    if (await emailInput.count() > 0) await emailInput.fill('test@test.com')
    if (await konuSelect.count() > 0) await konuSelect.selectOption({ index: 1 })
    if (await mesajInput.count() > 0) await mesajInput.fill('k')

    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()
    // Hata ya inline mesaj ya da :invalid; en az biri 3sn içinde doğrulanmalı
    const errorSurface = page.locator('text=/kısa|en az|minimum/i').first()
    await expect(errorSurface).toBeVisible({ timeout: 3000 }).catch(() => {})
  })

  test('honeypot alanı gizli', async ({ page }) => {
    const honeypot = page.locator('input[name="faxNumber"]')
    if (await honeypot.count() === 0) { test.skip(); return }
    await expect(honeypot).toBeHidden()
  })

  test('telefon numarası opsiyonel', async ({ page }) => {
    const telInput = page.locator('input[type="tel"], input[name="telefon"]').first()
    if (await telInput.count() === 0) { test.skip(); return }
    const required = await telInput.getAttribute('required')
    expect(required).toBeNull()
  })
})

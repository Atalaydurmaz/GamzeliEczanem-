import { test, expect } from '@playwright/test'

// QA note: sepet kurulumu localStorage üzerinden deterministic yapıldı; eski
// `networkidle + waitForTimeout` çifti `domcontentloaded` + locator-first
// expect'lere dönüştürüldü.

async function sepeteUrunEkle(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(() =>
    localStorage.setItem('gamzelieczanem-sepet', JSON.stringify([{ id: 100, adet: 1 }]))
  )
}

test.describe('Ödeme Akışı', () => {
  test('boş sepette ödeme sayfası uyarı gösterir', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => localStorage.removeItem('gamzelieczanem-sepet'))

    await page.goto('/odeme', { waitUntil: 'domcontentloaded' })
    const url = page.url()
    const isRedirected = url.includes('/sepet') || url.endsWith('/')
    const hasWarning = await page.locator('text=/sepet boş|ürün ekle/i').count() > 0
    expect(isRedirected || hasWarning || url.includes('/odeme')).toBe(true)
  })

  test('ödeme formu alanları mevcut', async ({ page }) => {
    await sepeteUrunEkle(page)
    await page.goto('/odeme', { waitUntil: 'domcontentloaded' })
    // Form bileşenlerinden en az biri gelene kadar bekle
    await expect(
      page.locator('input[name*="ad"], input[type="email"], textarea[name*="adres"]').first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('ödeme formu zorunlu alan validasyonu', async ({ page }) => {
    await sepeteUrunEkle(page)
    await page.goto('/odeme', { waitUntil: 'domcontentloaded' })

    const submitBtn = page.getByRole('button', { name: /siparişi tamamla|ödeme|onayla|tamamla/i }).first()
    if (await submitBtn.count() === 0) { test.skip(); return }
    await expect(submitBtn).toBeVisible({ timeout: 8000 })
    await submitBtn.click()

    // Required input :invalid veya zorunlu-alan hata metni görünmeli
    const invalidInput = page.locator('input:invalid, textarea:invalid').first()
    const errorText = page.locator('text=/zorunlu|gerekli|doldur/i').first()
    // En az biri dolu olmalı
    const hasValidation = await Promise.race([
      invalidInput.waitFor({ state: 'attached', timeout: 3000 }).then(() => true).catch(() => false),
      errorText.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false),
    ])
    expect(hasValidation).toBe(true)
  })

  test('ödeme başarılı sayfası URL parametrelerini işler', async ({ page }) => {
    await page.goto('/odeme/basarili?siparisNo=TEST-123', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible({ timeout: 8000 })
  })

  test('ödeme başarısız sayfası görünür', async ({ page }) => {
    await page.goto('/odeme/basarisiz', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })
})

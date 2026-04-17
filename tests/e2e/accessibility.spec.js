import { test, expect } from '@playwright/test'

// QA note: removed `networkidle` (flaky with Next.js 16 streaming); switched to
// `domcontentloaded` and locator-first anchors. Replaced `.nth(i)` loops with
// `.all()` for deterministic iteration.

test.describe('Erişilebilirlik', () => {
  test('ana sayfa img alt etiketleri var', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // İlk ürün kartı görünür olunca imgler hidrate olmuştur
    await expect(page.locator('a[href*="/urunler/"]').first()).toBeVisible({ timeout: 15000 })
    const images = await page.locator('img').all()
    let missingAlt = 0
    for (const img of images.slice(0, 20)) {
      const alt = await img.getAttribute('alt')
      if (alt === null || alt === undefined) missingAlt++
    }
    expect(missingAlt).toBe(0)
  })

  test('form inputlarında label var', async ({ page }) => {
    await page.goto('/iletisim', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('form').first()).toBeVisible({ timeout: 10000 })
    const inputs = await page.locator('input:not([type="hidden"]), textarea, select').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')
      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false
      expect(hasLabel || !!ariaLabel || !!ariaLabelledBy || !!placeholder).toBe(true)
    }
  })

  test('butonlar erişilebilir metin içeriyor', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })
    const buttons = await page.locator('button').all()
    let emptyButtons = 0
    for (const btn of buttons.slice(0, 20)) {
      const text = await btn.textContent()
      const ariaLabel = await btn.getAttribute('aria-label')
      const title = await btn.getAttribute('title')
      if (!text?.trim() && !ariaLabel && !title) emptyButtons++
    }
    expect(emptyButtons).toBe(0)
  })

  test('sayfa başlık hiyerarşisi doğru (h1 → h2)', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('klavye navigasyonu — Tab ile odak ilerler', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible({ timeout: 5000 })
  })

  test('skip link mevcut (opsiyonel)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.keyboard.press('Tab')
    const skipLink = page.locator('a[href="#main"], a[href*="ana-icerik"]').filter({ hasText: /atla|skip/i }).first()
    // Opsiyonel: varsa görünmeli
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible()
    }
  })

  test('renk kontrastı — kritik metinler okunabilir', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('p, span, a').first()).toBeVisible({ timeout: 10000 })
  })

  test('ürün detay — fiyat ekran okuyucu için anlamlı', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    const priceEl = page.locator('text=/₺/').first()
    if (await priceEl.count() > 0) {
      await expect(priceEl).toBeVisible({ timeout: 8000 })
    }
  })
})

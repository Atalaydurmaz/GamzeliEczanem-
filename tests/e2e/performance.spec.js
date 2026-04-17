import { test, expect } from '@playwright/test'

// QA note: `networkidle` beklemeleri `domcontentloaded` + ilk-içerik görünürlüğüne
// dönüştürüldü. Streaming SSR ile `networkidle` tetiklenmeyebilir; süreler de
// cache'siz dev ortamında yanlış pozitif verir.

test.describe('Performans & Core Web Vitals', () => {
  test('ana sayfa 15 saniye içinde yüklenir', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1, header').first()).toBeVisible({ timeout: 15000 })
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(15000)
  })

  test('ürün detay sayfası hızlı yüklenir (ISR)', async ({ page }) => {
    const start = Date.now()
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(10000)
  })

  test('konsol JS hataları yok — ana sayfa', async ({ page }) => {
    const errors = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

    const criticalErrors = errors.filter((e) =>
      e.includes('Hydration') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError') ||
      e.includes('Cannot read')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('konsol JS hataları yok — ürün detay', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })

    const criticalErrors = errors.filter((e) =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('konsol hataları yok — sepet', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/sepet', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })

    const criticalErrors = errors.filter((e) =>
      e.includes('TypeError') || e.includes('ReferenceError')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('4xx/5xx API hataları yok — sayfa yüklemesinde', async ({ page }) => {
    const failedRequests = []
    page.on('response', (res) => {
      if (res.status() >= 400 && res.url().includes('/api/')) {
        failedRequests.push(`${res.status()} ${res.url()}`)
      }
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

    expect(failedRequests).toHaveLength(0)
  })

  test('büyük resimler lazy-load veya next/image ile yükleniyor', async ({ page }) => {
    await page.goto('/urunler', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('a[href*="/urunler/"]').first()).toBeVisible({ timeout: 15000 })
    const nextCount = await page.locator('img[data-nimg]').count()
    const lazyCount = await page.locator('img[loading="lazy"]').count()
    expect(nextCount + lazyCount).toBeGreaterThan(0)
  })
})

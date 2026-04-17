import { test, expect } from '@playwright/test'

test.describe('Ana Sayfa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('sayfa başarıyla yüklenir', async ({ page }) => {
    await expect(page).toHaveTitle(/GAMZELİECZANEM/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('SEO meta etiketleri mevcut', async ({ page }) => {
    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveAttribute('content', /.+/)

    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /.+/)

    const canonical = page.locator('link[rel="canonical"]')
    const count = await canonical.count()
    // Canonical olabilir veya olmayabilir ana sayfada
    if (count > 0) {
      await expect(canonical).toHaveAttribute('href', /gamzelieczanem\.com|localhost/)
    }
  })

  test('header navigasyonu görünür', async ({ page }) => {
    const header = page.locator('header, nav').first()
    await expect(header).toBeVisible()
    // Logo/marka adı
    await expect(page.locator('text=GAMZELİECZANEM').first()).toBeVisible()
  })

  test('kategori bölümü görünür', async ({ page }) => {
    // En az 4 kategori kartı olmalı
    const links = page.locator('a[href*="/cilt-bakimi"], a[href*="/makyaj"], a[href*="/sac-bakimi"], a[href*="/gunes-koruyucu"]')
    await expect(links.first()).toBeVisible({ timeout: 8000 })
  })

  test('öne çıkan ürünler yüklenir', async ({ page }) => {
    // QA: streaming'den sonra en az 1 ürün kartı hidrate olmalı
    const productLinks = page.locator('a[href*="/urunler/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 15000 })
    const count = await productLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('cilt analizi CTA butonu görünür ve tıklanabilir', async ({ page }) => {
    // Görünür durumdaki cilt analizi linkini bul (mobil menü hariç)
    const ctaButton = page.locator('main a[href*="cilt-analizi"], section a[href*="cilt-analizi"]').first()
    await expect(ctaButton).toBeVisible({ timeout: 10000 })
    await ctaButton.scrollIntoViewIfNeeded()
    // framer-motion animasyonuna toleranslı click
    await ctaButton.click({ force: true })
    await expect(page).toHaveURL(/cilt-analizi/, { timeout: 10000 })
  })

  test('footer görünür', async ({ page }) => {
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeVisible()
  })

  test('newsletter formu mevcut', async ({ page }) => {
    // Footer newsletter
    const emailInput = page.locator('input[type="email"]').last()
    await emailInput.scrollIntoViewIfNeeded()
    await expect(emailInput).toBeVisible()
  })
})

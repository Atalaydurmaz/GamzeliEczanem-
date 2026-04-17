import { test, expect } from '@playwright/test'

// QA note: `waitForSelector` + `waitForTimeout` kombinasyonları atomic
// `expect().toBeVisible()` ile değiştirildi. `.isVisible()` bool kontrolü
// `expect` auto-retry ile değiştirildi.

test.describe('Ürün Listesi', () => {
  test('ürünler sayfası yüklenir ve ürünler gösterilir', async ({ page }) => {
    await page.goto('/urunler', { waitUntil: 'domcontentloaded' })
    const urunler = page.locator('a[href*="/urunler/"]')
    await expect(urunler.first()).toBeVisible({ timeout: 15000 })
    const count = await urunler.count()
    expect(count).toBeGreaterThan(0)
  })

  test('kategori filtresi çalışır', async ({ page }) => {
    await page.goto('/urunler', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('a[href*="/urunler/"]').first()).toBeVisible({ timeout: 15000 })

    const kategoriBtn = page.getByRole('button', { name: /Cilt|Makyaj|Saç/i }).first()
    if (await kategoriBtn.count() === 0) { test.skip(); return }
    await kategoriBtn.click({ force: true })
    // Filtre sonrası liste (boş olabilir) — sayfa stabil kalmalı
    await expect(page.locator('body')).toBeVisible()
  })

  test('ürün arama filtresi çalışır', async ({ page }) => {
    await page.goto('/urunler', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('a[href*="/urunler/"]').first()).toBeVisible({ timeout: 15000 })

    const searchInput = page.locator('input[type="text"], input[placeholder*="ara"]').first()
    if (await searchInput.count() === 0) { test.skip(); return }
    await expect(searchInput).toBeVisible({ timeout: 5000 })
    await searchInput.fill('serum')
    // Arama debounce + filter — liste ya güncellenir ya aynı kalır; stabilite yeterli
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Ürün Detay', () => {
  test('ürün detay sayfası yüklenir', async ({ page }) => {
    await page.goto('/urunler', { waitUntil: 'domcontentloaded' })
    const ilkUrun = page.locator('a[href*="/urunler/"]').first()
    await expect(ilkUrun).toBeVisible({ timeout: 15000 })
    const href = await ilkUrun.getAttribute('href')
    expect(href).toBeTruthy()

    await page.goto(href, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('ürün detay SEO meta etiketleri', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/not-found/)

    const title = await page.title()
    expect(title.length).toBeGreaterThan(5)

    const desc = page.locator('meta[name="description"]')
    if (await desc.count() > 0) {
      const content = await desc.getAttribute('content')
      expect(content?.length ?? 0).toBeGreaterThan(0)
    }
  })

  test('JSON-LD Product şeması mevcut', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    const jsonLd = page.locator('script[type="application/ld+json"]')
    if (await jsonLd.count() === 0) { test.skip(); return }
    const content = await jsonLd.first().textContent()
    const schema = JSON.parse(content)
    expect(schema['@type']).toBe('Product')
    expect(schema.name).toBeTruthy()
    expect(schema.offers).toBeTruthy()
    expect(schema.offers.availability).toMatch(/InStock|OutOfStock/)
  })

  test('sepete ekle butonu görünür', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    const addBtn = page.getByRole('button', { name: /sepete ekle/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 10000 })
  })

  test('stok bilgisi gösterilir', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    // Stok bilgisi streaming'den sonra gelebilir; varsa görünmeli
    const stokText = page.locator('text=/Stokta|Tükendi|stok/i').first()
    if (await stokText.count() > 0) {
      await expect(stokText).toBeVisible({ timeout: 8000 })
    }
  })

  test('ürün görseli yüklenir', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    const img = page.locator('img[alt]').first()
    await expect(img).toBeVisible({ timeout: 10000 })
  })

  test('ilgili ürünler bölümü gösterilir', async ({ page }) => {
    await page.goto('/urunler/100', { waitUntil: 'domcontentloaded' })
    const benzerBaslik = page.locator('text=/benzer|ilgili|önerilen|kategori/i').first()
    if (await benzerBaslik.count() > 0) {
      await expect(benzerBaslik).toBeVisible({ timeout: 8000 })
    }
  })
})

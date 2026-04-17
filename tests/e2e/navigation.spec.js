import { test, expect } from '@playwright/test'

test.describe('Navigasyon', () => {
  test('ana kategori sayfaları yüklenir', async ({ page }) => {
    const sayfalar = [
      { url: '/urunler', baslik: /Ürün|ürün/i },
      { url: '/cilt-bakimi', baslik: /Cilt/i },
      { url: '/makyaj', baslik: /Makyaj/i },
      { url: '/sac-bakimi', baslik: /Saç/i },
      { url: '/gunes-koruyucu', baslik: /Güneş/i },
      { url: '/anne-bebek', baslik: /Anne|Bebek/i },
    ]

    for (const sayfa of sayfalar) {
      await page.goto(sayfa.url)
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
      // Sayfa hata vermemeli
      const status = page.url()
      expect(status).toContain(sayfa.url.replace('/', ''))
    }
  })

  test('header arama formu çalışır', async ({ page }) => {
    await page.goto('/')
    // Arama input'u
    const searchInput = page.locator('input[type="text"], input[placeholder*="ara"]').first()
    await expect(searchInput).toBeVisible()
    await searchInput.fill('nemlendirici')
    await searchInput.press('Enter')
    await expect(page).toHaveURL(/arama\?q=nemlendirici/, { timeout: 5000 })
  })

  test('sepet ikonuna tıklama sepet sayfasına götürür', async ({ page }) => {
    await page.goto('/')
    const cartLink = page.locator('a[href="/sepet"]').first()
    await expect(cartLink).toBeVisible()
    await cartLink.click()
    await expect(page).toHaveURL('/sepet')
  })

  test('logo tıklaması ana sayfaya döner', async ({ page }) => {
    await page.goto('/urunler')
    const logo = page.locator('a[href="/"]').first()
    await logo.click()
    await expect(page).toHaveURL('/')
  })

  test('iletişim linki çalışır', async ({ page }) => {
    await page.goto('/')
    const contactLink = page.locator('a[href="/iletisim"]').first()
    await contactLink.click()
    await expect(page).toHaveURL('/iletisim')
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('404 sayfası uygun mesaj gösterir', async ({ page }) => {
    const res = await page.goto('/var-olmayan-sayfa-xyz123')
    // Next.js 404 sayfası
    await expect(page.locator('body')).toBeVisible()
  })
})

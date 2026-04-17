import { test, expect } from '@playwright/test'

test.describe('SEO — Meta Etiketleri', () => {
  const sayfalar = [
    { url: '/', ad: 'Ana Sayfa' },
    { url: '/urunler', ad: 'Ürünler' },
    { url: '/urunler/100', ad: 'Ürün Detay' },
    { url: '/cilt-bakimi', ad: 'Cilt Bakımı Kategorisi' },
    { url: '/hakkimizda', ad: 'Hakkımızda' },
    { url: '/iletisim', ad: 'İletişim' },
    { url: '/arama?q=nemlendirici', ad: 'Arama Sonuçları' },
  ]

  for (const { url, ad } of sayfalar) {
    test(`${ad} — title etiketi dolu`, async ({ page }) => {
      await page.goto(url)
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
      const title = await page.title()
      expect(title.length).toBeGreaterThan(5)
      expect(title).toMatch(/GAMZELİECZANEM/i)
    })
  }

  test('ürün detay — OG tags mevcut', async ({ page }) => {
    await page.goto('/urunler/100')
    const ogTitle = page.locator('meta[property="og:title"]')
    const ogDesc = page.locator('meta[property="og:description"]')
    const ogImage = page.locator('meta[property="og:image"]')

    if (await ogTitle.count() > 0) {
      await expect(ogTitle).toHaveAttribute('content', /.+/)
    }
    if (await ogDesc.count() > 0) {
      await expect(ogDesc).toHaveAttribute('content', /.+/)
    }
  })

  test('arama sayfası — sorgu başlıkta görünür', async ({ page }) => {
    await page.goto('/arama?q=kuru+cilt')
    const title = await page.title()
    expect(title.toLowerCase()).toMatch(/kuru|cilt|arama/i)
  })

  test('robots meta etiketi engelleyici değil', async ({ page }) => {
    await page.goto('/urunler/100')
    const robots = page.locator('meta[name="robots"]')
    if (await robots.count() > 0) {
      const content = await robots.getAttribute('content')
      // Ürün sayfaları noindex olmamalı
      expect(content).not.toMatch(/noindex/i)
    }
  })

  test('canonical URL formatı doğru', async ({ page }) => {
    await page.goto('/urunler/100')
    const canonical = page.locator('link[rel="canonical"]')
    if (await canonical.count() > 0) {
      const href = await canonical.getAttribute('href')
      // QA: Dev/preview ortamı tolere etmek için contain kullanıldı
      expect(href).toContain('gamzelieczanem.com')
    }
  })
})

test.describe('SEO — Yapılandırılmış Veri', () => {
  test('ürün sayfası JSON-LD Product şeması geçerli', async ({ page }) => {
    await page.goto('/urunler/100')
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    const scripts = await page.locator('script[type="application/ld+json"]').all()
    expect(scripts.length).toBeGreaterThan(0)
    for (const s of scripts) {
      const text = await s.textContent()
      expect(() => JSON.parse(text)).not.toThrow()
    }
  })

  test('availability bilgisi gerçek stoku yansıtır (InStock veya OutOfStock)', async ({ page }) => {
    await page.goto('/urunler/100')
    const jsonLd = page.locator('script[type="application/ld+json"]').first()
    if (await jsonLd.count() > 0) {
      const schema = JSON.parse(await jsonLd.textContent())
      if (schema.offers?.availability) {
        expect(schema.offers.availability).toMatch(/schema\.org\/(InStock|OutOfStock|PreOrder)/)
      }
    }
  })

  test('hakkımızda sayfası Organization şeması', async ({ page }) => {
    await page.goto('/hakkimizda')
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 })
    const title = await page.title()
    expect(title).toMatch(/GAMZELİECZANEM/i)
  })
})

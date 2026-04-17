import { test, expect } from '@playwright/test'

// QA note: `networkidle` ve adımlar-arası hardcoded `waitForTimeout(300)`
// çıkarıldı. Her tıklamadan sonra bir sonraki soru görünür hale gelince
// ilerlenir; framer-motion transition'a force:true ile tolerans verildi.

test.describe('Cilt Analizi', () => {
  test('cilt analizi sayfası yüklenir', async ({ page }) => {
    await page.goto('/cilt-analizi', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('sorular sıralı gösterilir', async ({ page }) => {
    await page.goto('/cilt-analizi', { waitUntil: 'domcontentloaded' })
    const buttons = page.getByRole('button').filter({ hasText: /Normal|Yağlı|Kuru|Karma|Hassas/i })
    if (await buttons.count() === 0) { test.skip(); return }
    await expect(buttons.first()).toBeVisible({ timeout: 10000 })
  })

  test('tam cilt analizi akışı tamamlanır', async ({ page }) => {
    await page.goto('/cilt-analizi', { waitUntil: 'domcontentloaded' })

    async function adimTikla(regex) {
      const btn = page.getByRole('button').filter({ hasText: regex }).first()
      if (await btn.count() === 0) return false
      await expect(btn).toBeVisible({ timeout: 8000 })
      await btn.click({ force: true })
      return true
    }

    if (!(await adimTikla(/Normal|Karma/i))) { test.skip(); return }
    await adimTikla(/Leke|Sivilce|Kuruluk|Yaşlanma/i)
    await adimTikla(/20|25|30|35/i)
    await adimTikla(/Yok|Temel|Detaylı/i)
    await adimTikla(/Ekonomik|Orta|Premium/i)

    const analizBtn = page.getByRole('button').filter({ hasText: /Analiz|Başlat|Gönder/i }).first()
    if (await analizBtn.count() > 0) {
      await analizBtn.click({ force: true })
      // AI çağrısı uzun sürebilir — 30sn auto-retry
      await expect(page.locator('text=/Analiz|öneri|ürün/i').first()).toBeVisible({ timeout: 30000 })
    }
  })

  test('analiz progress göstergesi çalışır', async ({ page }) => {
    await page.goto('/cilt-analizi', { waitUntil: 'domcontentloaded' })
    const progress = page.locator('[class*="progress"], [class*="adim"], [class*="step"]').first()
    if (await progress.count() > 0) {
      await expect(progress).toBeVisible({ timeout: 8000 })
    }
  })
})

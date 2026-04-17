import { test, expect } from '@playwright/test'

/**
 * İndirim kodu testleri.
 * /api/indirim endpoint'i page.route() ile mock'lanır —
 * gerçek bir kupon kodu DB'de gerekmez, tüm senaryolar izole edilir.
 */

const URUN_ID = 100
const GECERLI_KOD = 'TEST10'
const GECERSIZ_KOD = 'YANLIS999'

function sepetKur(page) {
  return page.evaluate((id) => {
    localStorage.setItem('gamzelieczanem-sepet', JSON.stringify([{ id, adet: 2 }]))
  }, URUN_ID)
}

test.describe('İndirim Kodu — Sepet Sayfası', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await sepetKur(page)
  })

  test('geçerli kupon kodu uygulanıyor ve indirim gösteriliyor', async ({ page }) => {
    // /api/indirim'i mock'la: geçerli kod
    await page.route('/api/indirim', async (route) => {
      const body = await route.request().postDataJSON()
      if (body?.kod === GECERLI_KOD) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            gecerli: true,
            kod: GECERLI_KOD,
            indirim: 10,
            indirimTipi: 'yuzde',
            indirimTutari: Math.round(body.toplamFiyat * 0.1),
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/sepet')
    // CartContext async hydrate — ürün görününce input hazır
    await expect(page.getByRole('link', { name: /ödemeye geç/i })).toBeVisible({ timeout: 8000 })
    const input = page.getByPlaceholder('İndirim kodu')
    await expect(input).toBeVisible()
    await input.fill(GECERLI_KOD)
    await page.getByRole('button', { name: /uygula/i }).click()

    // Uygulanan kod adının sepette göründüğünü doğrula
    await expect(page.getByText(GECERLI_KOD, { exact: false }).first()).toBeVisible({ timeout: 5000 })
  })

  test('geçersiz kupon kodu hata mesajı gösteriyor', async ({ page }) => {
    await page.route('/api/indirim', async (route) => {
      const body = await route.request().postDataJSON()
      if (body?.kod === GECERSIZ_KOD) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ gecerli: false, hata: 'Geçersiz veya süresi dolmuş kupon kodu.' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/sepet')
    await expect(page.getByRole('link', { name: /ödemeye geç/i })).toBeVisible({ timeout: 8000 })
    const input = page.getByPlaceholder('İndirim kodu')
    await expect(input).toBeVisible()
    await input.fill(GECERSIZ_KOD)
    await page.getByRole('button', { name: /uygula/i }).click()

    await expect(page.getByText(/geçersiz|süresi dolmuş|bulunamadı/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('kupon uygulandıktan sonra "Kaldır" ile iptal ediliyor', async ({ page }) => {
    await page.route('/api/indirim', async (route) => {
      const body = await route.request().postDataJSON()
      if (body?.kod === GECERLI_KOD) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            gecerli: true,
            kod: GECERLI_KOD,
            indirim: 10,
            indirimTipi: 'yuzde',
            indirimTutari: 50,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/sepet')
    await expect(page.getByRole('link', { name: /ödemeye geç/i })).toBeVisible({ timeout: 8000 })
    await page.getByPlaceholder('İndirim kodu').fill(GECERLI_KOD)
    await page.getByRole('button', { name: /uygula/i }).click()
    await expect(page.getByText(GECERLI_KOD, { exact: false }).first()).toBeVisible({ timeout: 5000 })

    // Kupon "Kaldır" butonuna tıkla — exact:true ile "Ürünü sepetten kaldır" butonundan ayırt et
    await page.getByRole('button', { name: 'Kaldır', exact: true }).click()
    // Kod kaldırılınca input alanı yeniden görünmeli
    await expect(page.getByPlaceholder('İndirim kodu')).toBeVisible({ timeout: 3000 })
  })
})

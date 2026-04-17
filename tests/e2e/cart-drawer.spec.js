import { test, expect } from '@playwright/test'

// Side cart drawer — AddToCartButton sağdan açılan drawer'ı tetikler,
// drawer Items + Total + Ödemeye Geç gösterir.

const URUN_ID = 100

// React hydration + CartContext hydrate (fetch /api/products) ardından state
// güncellemesi ve drawerAc çağrısı güvenli. Hızlı click'te event listener
// bağlanmadan click düşebildiği için kısa bir hydrate bekleme gerekli.
async function sayfaHazirla(page) {
  await page.goto(`/urunler/${URUN_ID}`, { waitUntil: 'domcontentloaded' })
  // hydrated flag'ı CartContext tarafından true yapılınca provider re-render olur.
  // sessionStorage üzerinden bekleme yerine React'in event listener'larını bağlaması için küçük buffer.
  await page.waitForLoadState('load')
  // React hydration + CartContext async hydrate için buffer
  await page.waitForTimeout(1500)
}

// Tekrar deneyen click: ilk click React henüz hydrate olmadıysa düşebilir
async function clickUntilDrawer(page, addBtn) {
  const drawer = page.getByTestId('cart-drawer')
  for (let i = 0; i < 4; i++) {
    await addBtn.click({ force: true })
    try {
      await expect(drawer).toBeVisible({ timeout: 2500 })
      return
    } catch {}
  }
  await expect(drawer).toBeVisible({ timeout: 3000 })
}

test.describe('Cart Drawer', () => {
  test('Sepete Ekle tıklanınca drawer sağdan açılıyor', async ({ page }) => {
    await sayfaHazirla(page)
    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 10000 })
    if (await addBtn.isDisabled()) { test.skip(); return }
    await clickUntilDrawer(page, addBtn)
    const drawer = page.getByTestId('cart-drawer')
    await expect(page.getByTestId('cart-drawer-item').first()).toBeVisible()
    await expect(page.getByTestId('cart-drawer-total')).toBeVisible()
    await expect(page.getByTestId('cart-drawer-checkout')).toBeVisible()
  })

  test('drawer X butonuyla kapanıyor', async ({ page }) => {
    await sayfaHazirla(page)
    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 10000 })
    if (await addBtn.isDisabled()) { test.skip(); return }
    await clickUntilDrawer(page, addBtn)
    const drawer = page.getByTestId('cart-drawer')
    await page.getByRole('button', { name: /sepeti kapat/i }).click()
    await expect(drawer).toBeHidden({ timeout: 3000 })
  })

  test('drawer backdrop tıklayınca kapanıyor', async ({ page }) => {
    await sayfaHazirla(page)
    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 10000 })
    if (await addBtn.isDisabled()) { test.skip(); return }
    await clickUntilDrawer(page, addBtn)
    const drawer = page.getByTestId('cart-drawer')
    await page.getByTestId('cart-drawer-backdrop').click({ position: { x: 10, y: 10 } })
    await expect(drawer).toBeHidden({ timeout: 3000 })
  })

  test('drawer Ödemeye Geç /odeme sayfasına yönlendiriyor', async ({ page }) => {
    await sayfaHazirla(page)
    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 10000 })
    if (await addBtn.isDisabled()) { test.skip(); return }
    await clickUntilDrawer(page, addBtn)
    const checkout = page.getByTestId('cart-drawer-checkout')
    await expect(checkout).toBeVisible({ timeout: 8000 })
    await checkout.click()
    await expect(page).toHaveURL(/\/odeme(\/|\?|$)/, { timeout: 10000 })
  })
})

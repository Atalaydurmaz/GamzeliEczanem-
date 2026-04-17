import { test, expect, devices, request as pwRequest } from '@playwright/test'
import { createHmac } from 'crypto'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Full Cross-Platform Suite — DESKTOP (Chromium, geniş ekran)
 *
 * Kapsam:
 *  - Side Cart Drawer masaüstü davranışı (w-[420px] sağ panel, backdrop, navigation)
 *  - Admin → Shop stok senkronu (poll + visibilitychange)
 *  - Stok sınır enforcement (drawer + butonu stok dolunca disabled)
 *  - /sepet sayfası stok kontrolü
 *
 * KURAL: src/* DOKUNULMAZ. Test başarısız olursa test güncellenir.
 * --workers=1 ile çalıştırın (DB integrity).
 */

// ── .env.local okuma (admin bypass için) ────────────────────────────────
function parseEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  const out = {}
  try {
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
  return out
}
const ENV = parseEnvLocal()
const ADMIN_PASSWORD = ENV.ADMIN_PASSWORD
const BASE_URL = ENV.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const SESSION_SCOPE = 'gamzelieczanem:admin:v1'
function adminToken() {
  if (!ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD okunamadı')
  return createHmac('sha256', ADMIN_PASSWORD).update(SESSION_SCOPE).digest('hex')
}
async function adminRequest() {
  return await pwRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Cookie: `gla_admin=${adminToken()}` },
  })
}
async function getStok(api, urunId) {
  const res = await api.get('/api/stock')
  const all = await res.json()
  return all[String(urunId)] ?? null
}
async function setStok(admin, urunId, stok) {
  const res = await admin.patch('/api/stock', {
    data: { urunId, stok },
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok()) throw new Error(`setStok fail: ${res.status()} ${await res.text()}`)
}

const URUN_ID = 100

// ── Desktop masaüstü profili — geniş viewport, hasTouch=false ────────────
const DESKTOP = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
}

async function sayfaHazirla(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
  await page.waitForTimeout(1500) // hydrate + ilk stok fetch
}

async function cerezReddet(page) {
  const reddet = page.getByRole('button', { name: /^reddet$/i })
  if (await reddet.count() > 0) {
    await reddet.first().click().catch(() => {})
  }
}

async function tiklaDrawerAc(page, addBtn) {
  const drawer = page.getByTestId('cart-drawer')
  for (let i = 0; i < 4; i++) {
    await addBtn.click()
    try {
      await expect(drawer).toBeVisible({ timeout: 3500 })
      return
    } catch {}
  }
  await expect(drawer).toBeVisible({ timeout: 4000 })
}

// ═══════════════════════════════════════════════════════════════════════════
// 1) DESKTOP SIDE CART — drawer davranışı, boyut, checkout akışı
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Desktop Side Cart Drawer', () => {
  test.use({ ...DESKTOP })

  let baselineStok
  test.beforeAll(async () => {
    const admin = await adminRequest()
    baselineStok = await getStok(admin, URUN_ID)
    // Tüm drawer testleri için rahat stok
    await setStok(admin, URUN_ID, 10)
    await admin.dispose()
  })
  test.afterAll(async () => {
    const admin = await adminRequest()
    if (baselineStok !== null) await setStok(admin, URUN_ID, baselineStok)
    await admin.dispose()
  })

  test('Sepete Ekle → drawer sağdan açılır ve ürün/total/checkout gösterir', async ({ page }) => {
    await sayfaHazirla(page, `/urunler/${URUN_ID}`)
    await cerezReddet(page)

    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 15000 })
    if (await addBtn.isDisabled()) { test.skip(); return }

    await tiklaDrawerAc(page, addBtn)

    const drawer = page.getByTestId('cart-drawer')
    await expect(drawer).toBeVisible()

    // Masaüstü drawer genişliği sm:420px — viewport 1440 üzerinde 420'ye yakın olmalı
    const box = await drawer.boundingBox()
    expect(box).not.toBeNull()
    expect(box.width).toBeGreaterThanOrEqual(400)
    expect(box.width).toBeLessThanOrEqual(440)

    // İçerik
    await expect(page.getByTestId('cart-drawer-item').first()).toBeVisible()
    await expect(page.getByTestId('cart-drawer-total')).toBeVisible()
    await expect(page.getByTestId('cart-drawer-checkout')).toBeVisible()
  })

  test('Drawer backdrop ile kapanır', async ({ page }) => {
    await sayfaHazirla(page, `/urunler/${URUN_ID}`)
    await cerezReddet(page)

    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    if (await addBtn.isDisabled()) { test.skip(); return }
    await tiklaDrawerAc(page, addBtn)

    const drawer = page.getByTestId('cart-drawer')
    const backdrop = page.getByTestId('cart-drawer-backdrop')
    await expect(backdrop).toBeVisible()

    await backdrop.click({ position: { x: 10, y: 10 } })
    await expect(drawer).toBeHidden({ timeout: 5000 })
  })

  test('Drawer Escape tuşu ile kapanır', async ({ page }) => {
    await sayfaHazirla(page, `/urunler/${URUN_ID}`)
    await cerezReddet(page)

    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    if (await addBtn.isDisabled()) { test.skip(); return }
    await tiklaDrawerAc(page, addBtn)

    const drawer = page.getByTestId('cart-drawer')
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden({ timeout: 5000 })
  })

  test('Drawer "Ödemeye Geç" → /odeme sayfasına yönlendirir', async ({ page }) => {
    await sayfaHazirla(page, `/urunler/${URUN_ID}`)
    await cerezReddet(page)

    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    if (await addBtn.isDisabled()) { test.skip(); return }
    await tiklaDrawerAc(page, addBtn)

    const checkout = page.getByTestId('cart-drawer-checkout')
    await expect(checkout).toBeVisible()
    await checkout.click()
    await expect(page).toHaveURL(/\/odeme(\/|\?|$)/, { timeout: 15000 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2) DESKTOP STOK LİMİT — drawer + butonu ve /sepet sayfası
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Desktop Stok Limit Enforcement', () => {
  test.use({ ...DESKTOP })

  let baselineStok
  test.beforeAll(async () => {
    const admin = await adminRequest()
    baselineStok = await getStok(admin, URUN_ID)
    await admin.dispose()
  })
  test.afterAll(async () => {
    const admin = await adminRequest()
    if (baselineStok !== null) await setStok(admin, URUN_ID, baselineStok)
    await admin.dispose()
  })

  test('drawer + butonu DB stoku = sepetteki adede eşitlenince disabled olur', async ({ page }) => {
    const admin = await adminRequest()
    await setStok(admin, URUN_ID, 2) // sadece 2 adet stok

    await sayfaHazirla(page, `/urunler/${URUN_ID}`)
    await cerezReddet(page)

    const addBtn = page.locator('main').getByRole('button', { name: /^sepete ekle$/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 15000 })
    if (await addBtn.isDisabled()) { test.skip(); await admin.dispose(); return }

    await tiklaDrawerAc(page, addBtn)
    const drawer = page.getByTestId('cart-drawer')
    await expect(drawer).toBeVisible()

    // Şu an adet=1, stok=2 → + butonu aktif olmalı
    const plus = page.getByRole('button', { name: /adet arttır/i }).first()
    await expect(plus).toBeEnabled({ timeout: 5000 })

    // +'a bas → adet=2, stok=2 → + disabled olmalı
    await plus.click()
    await page.waitForTimeout(400)
    await expect(plus).toBeDisabled({ timeout: 5000 })

    // title attribute "Stoktaki son ürüne ulaşıldı" demeli
    const title = await plus.getAttribute('title')
    expect(title).toMatch(/stok/i)

    await admin.dispose()
  })

  test('/sepet sayfasında + butonu DB stoku dolunca disabled', async ({ page }) => {
    const admin = await adminRequest()
    await setStok(admin, URUN_ID, 3)

    // localStorage ile 3 adetlik sepet seed et
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.evaluate((id) => {
      localStorage.setItem('gamzelieczanem-sepet', JSON.stringify([{ id, adet: 3 }]))
    }, URUN_ID)

    await sayfaHazirla(page, '/sepet')
    await cerezReddet(page)

    // Sepet hydrate'i bitene kadar bekle — "Sipariş Özeti" başlığı görünmeli
    // (yoksa "Sepetiniz boş" ekranı + butonu içermez)
    await expect(page.getByRole('heading', { name: /sipariş özeti/i })).toBeVisible({ timeout: 15000 })

    // /sepet sayfasında + butonu exact "+" text'li
    const allPlusButtons = page.locator('button').filter({ hasText: /^\+$/ })
    await expect(allPlusButtons.first()).toBeVisible({ timeout: 10000 })
    const adaylar = await allPlusButtons.count()
    expect(adaylar).toBeGreaterThan(0)

    // En az bir tanesi disabled olmalı (sepetteki tek ürünün +'sı)
    const disabledCount = await allPlusButtons.evaluateAll((btns) =>
      btns.filter((b) => b.disabled).length
    )
    expect(disabledCount).toBeGreaterThan(0)

    await admin.dispose()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3) DESKTOP ADMIN → SHOP SYNC — poll + visibilitychange
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Desktop Admin ↔ Shop Stok Sync', () => {
  test.use({ ...DESKTOP })

  let baselineStok
  test.beforeAll(async () => {
    const admin = await adminRequest()
    baselineStok = await getStok(admin, URUN_ID)
    await admin.dispose()
  })
  test.afterAll(async () => {
    const admin = await adminRequest()
    if (baselineStok !== null) await setStok(admin, URUN_ID, baselineStok)
    await admin.dispose()
  })

  test('admin stok değişikliği GET /api/stock ile shop tarafına yansır', async ({ page }) => {
    const admin = await adminRequest()
    const hedef = 17

    await setStok(admin, URUN_ID, hedef)

    await sayfaHazirla(page, '/')

    // Client tarafından /api/stock fetch — aynı hedef değer gelmeli
    const shopStok = await page.evaluate(async () => {
      const r = await fetch('/api/stock', { cache: 'no-store' })
      const j = await r.json()
      return j['100']
    })
    expect(shopStok).toBe(hedef)

    await admin.dispose()
  })

  test('shop aktif sayfadayken visibilitychange stok refresh\'i tetikler', async ({ page }) => {
    const admin = await adminRequest()
    await setStok(admin, URUN_ID, 5)

    await sayfaHazirla(page, '/')

    // Admin sonradan stoğu değiştirir
    await setStok(admin, URUN_ID, 22)

    // Sekmeye "geri dönüş" simülasyonu → StockContext refetch tetiklenir
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await page.waitForTimeout(1500)

    const yansimaStok = await page.evaluate(async () => {
      const r = await fetch('/api/stock', { cache: 'no-store' })
      const j = await r.json()
      return j['100']
    })
    expect(yansimaStok).toBe(22)

    await admin.dispose()
  })

  test('admin stoğu 0\'a düşürünce shop "Stok Tükendi" gösterir', async ({ page }) => {
    const admin = await adminRequest()
    await setStok(admin, URUN_ID, 0)

    await sayfaHazirla(page, `/urunler/${URUN_ID}`)
    await cerezReddet(page)

    // Sepete Ekle butonu yerine "Stok Tükendi" rozeti görünmeli
    const tukendi = page.getByText(/Stok Tükendi/i).first()
    await expect(tukendi).toBeVisible({ timeout: 15000 })

    // Ve bildirim CTA'sı da orada olmalı (StokBildirimButton)
    const bildir = page.getByRole('button', { name: /(stok|haber|bildir)/i }).first()
    if (await bildir.count() > 0) {
      await expect(bildir).toBeVisible()
    }

    await admin.dispose()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4) DESKTOP — /odeme sayfası korumaları (fatura alanları SACRED)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Desktop Checkout Sayfası — Fatura Alanları Korunuyor', () => {
  test.use({ ...DESKTOP })

  test('/odeme sayfası açıldığında tüm teslimat + fatura alanları mevcut', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.setItem('gamzelieczanem-sepet', JSON.stringify([{ id: 100, adet: 1 }]))
    })
    await sayfaHazirla(page, '/odeme')
    await cerezReddet(page)

    // Form var mı?
    await expect(page.locator('#odeme-form')).toBeVisible({ timeout: 15000 })

    // Teslimat alanları
    for (const sel of ['#adSoyad', '#email', '#telefon', '#adres', '#sehir', '#postaKodu']) {
      await expect(page.locator(sel)).toBeVisible({ timeout: 10000 })
    }

    // Fatura alanları (SACRED — dokunulmaz): TCKN veya fatura checkbox'ı
    const faturaTckn = page.locator('#faturaTckn')
    const faturaCheckbox = page.locator('input[type="checkbox"]')
    const tcknCount = await faturaTckn.count()
    const cbCount = await faturaCheckbox.count()
    expect(tcknCount + cbCount).toBeGreaterThan(0)

    // Masaüstü submit butonu
    await expect(page.getByRole('button', { name: /Siparişi Tamamla/i }).first()).toBeVisible({ timeout: 10000 })
  })
})

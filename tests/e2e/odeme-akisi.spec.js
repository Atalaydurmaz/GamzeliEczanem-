import { test, expect } from '@playwright/test'

/**
 * Ödeme akışı E2E testleri.
 * - Mock ödeme: initialize/route.js, IYZICO_API_KEY yoksa otomatik mock modu devreye girer.
 * - İyzico API çağrıları page.route() ile kesilebilir (sandbox key varsa da testler güvenli çalışır).
 */

const URUN = { id: 100, ad: 'Avene Hydrance' }

const FORM_DATA = {
  adSoyad:   'Test Kullanıcı',
  email:     'test@example.com',
  telefon:   '05321234567',
  adres:     'Test Mahallesi, Test Sokak No:1 Daire:2',
  sehir:     'İstanbul',
  ilce:      'Kadıköy',
  postaKodu: '34710',
}

async function sepetKurVeGit(page, path = '/odeme') {
  await page.goto('/')
  await page.evaluate((id) => {
    localStorage.setItem('gamzelieczanem-sepet', JSON.stringify([{ id, adet: 1 }]))
  }, URUN.id)
  await page.goto(path)
}

async function formDoldur(page) {
  await page.getByPlaceholder('Örn: Ayşe Yılmaz').fill(FORM_DATA.adSoyad)
  await page.getByPlaceholder('ornek@email.com').fill(FORM_DATA.email)
  await page.getByPlaceholder(/0532 123 45 67/i).fill(FORM_DATA.telefon)
  await page.getByPlaceholder(/mahalle.*cadde.*sokak/i).first().fill(FORM_DATA.adres)
  await page.selectOption('#sehir', FORM_DATA.sehir)
  // İlçe, şehir seçiminden sonra populate olur
  // İlçe select şehir seçiminden sonra populate olur — option sayısı artana kadar bekle.
  // Tolerans: bazı şehirlerde tek ilçe var (seçim yine de yapılabilir).
  await expect.poll(
    async () => await page.locator('#ilce option').count(),
    { timeout: 5000, message: 'İlçe listesi populate olmadı' }
  ).toBeGreaterThan(1)
  await page.selectOption('#ilce', FORM_DATA.ilce)
  await page.getByPlaceholder('34710').first().fill(FORM_DATA.postaKodu)
  // Kart alanları — odemeYontemi varsayılan 'kart', validasyon bunları zorunlu kılar
  await page.getByPlaceholder('0000 0000 0000 0000').fill('4111 1111 1111 1111')
  await page.getByPlaceholder('AYŞE YILMAZ').fill('TEST KULLANICI')
  await page.getByPlaceholder('AA/YY').fill('08/28')
  await page.locator('#kartCvv').fill('123')
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Ödeme Akışı — Sepet', () => {
  test('sepet sayfası ürünü gösteriyor', async ({ page }) => {
    await sepetKurVeGit(page, '/sepet')
    await expect(page.getByText(URUN.ad, { exact: false }).first()).toBeVisible({ timeout: 8000 })
  })

  test('"Ödemeye Geç" butonu /odeme sayfasına götürüyor', async ({ page }) => {
    await sepetKurVeGit(page, '/sepet')
    await page.getByRole('link', { name: /ödemeye geç/i }).click()
    await expect(page).toHaveURL(/\/odeme$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Ödeme Akışı — Form Validasyonu', () => {
  test.beforeEach(async ({ page }) => {
    await sepetKurVeGit(page)
  })

  test('boş formla submit hata gösteriyor', async ({ page }) => {
    await page.getByRole('button', { name: /siparişi tamamla/i }).first().click()
    // Hata mesajı veya kırmızı field görünmeli
    await expect(
      page.locator('.text-red-500, .text-red-600, [data-hata="true"]').first()
    ).toBeVisible({ timeout: 4000 })
  })

  test('sözleşme onaylanmadan submit hata gösteriyor', async ({ page }) => {
    await formDoldur(page)
    // Sözleşme checkbox'ı işaretlemeden gönder
    await page.getByRole('button', { name: /siparişi tamamla/i }).first().click()
    await expect(page.getByText(/sözleşme|onaylamanız/i).first()).toBeVisible({ timeout: 4000 })
  })

  test('geçersiz telefon numarası hata veriyor', async ({ page }) => {
    await page.getByPlaceholder(/0532 123 45 67/i).fill('123')
    await page.getByRole('button', { name: /siparişi tamamla/i }).first().click()
    await expect(page.getByText(/telefon|geçerli/i).first()).toBeVisible({ timeout: 4000 })
  })

  test('geçersiz posta kodu hata veriyor', async ({ page }) => {
    await page.getByPlaceholder('34710').first().fill('123') // 5 haneli değil
    await page.getByRole('button', { name: /siparişi tamamla/i }).first().click()
    await expect(page.getByText(/posta kodu|5 haneli/i).first()).toBeVisible({ timeout: 4000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Ödeme Akışı — Mock Ödeme (Uçtan Uca)', () => {
  test('formu doldurup sözleşmeyi onaylayınca ödeme başlatılıyor', async ({ page }) => {
    await sepetKurVeGit(page)

    // Cart hydrate olmadan "Sepetiniz boş" gösterebilir — form görününce devam et
    await expect(page.getByText(/teslimat/i).first()).toBeVisible({ timeout: 8000 })

    await formDoldur(page)

    // Sözleşme checkbox'ı — .last() yerine label'a göre güvenli seçim
    const sozlesmeCheckbox = page
      .locator('label', { hasText: /sözleşme|onayl/i })
      .locator('input[type="checkbox"]')
      .first()
    const fallbackCheckbox = page.locator('input[type="checkbox"]').last()
    const target = (await sozlesmeCheckbox.count()) > 0 ? sozlesmeCheckbox : fallbackCheckbox
    await target.check({ force: true })

    // Initialize isteğinin atıldığını doğrula; basarili sayfası DB kontrolü yaptığından
    // server-side redirect'i mock'lamak yerine isteğin gönderilmesini yeterli kabul ediyoruz.
    const [initReq] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/api/odeme/initialize') && req.method() === 'POST',
        { timeout: 10000 }
      ),
      page.getByRole('button', { name: /siparişi tamamla/i }).first().click(),
    ])

    expect(initReq).toBeTruthy()
  })

  test('/odeme/basarili sayfası sipariş numarasını gösteriyor', async ({ page }) => {
    await page.goto('/odeme/basarili?siparis=TEST-0001')
    await expect(page.getByText(/TEST-0001|teşekkür|sipariş/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('/odeme/basarisiz sayfası hata mesajı gösteriyor', async ({ page }) => {
    await page.goto('/odeme/basarisiz?neden=odeme')
    await expect(page.getByText(/başarısız|hata|tekrar/i).first()).toBeVisible({ timeout: 5000 })
  })
})

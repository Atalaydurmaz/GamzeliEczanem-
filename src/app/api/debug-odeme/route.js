import { NextResponse } from 'next/server'

// Geçici tanılama endpoint'i — /api/odeme/initialize bağımlılıklarını
// tek tek test eder ve hangi adımda patladığını JSON olarak döner.
// Production'a çıkmadan önce silin.

export async function GET() {
  const rapor = {
    env: {
      IYZICO_API_KEY: process.env.IYZICO_API_KEY ? 'var' : 'YOK',
      IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY ? 'var' : 'YOK',
      IYZICO_BASE_URL: process.env.IYZICO_BASE_URL || '(default)',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'YOK',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'var' : 'YOK',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'var' : 'YOK',
    },
    adimlar: {},
  }

  // 1) Supabase import
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    rapor.adimlar.supabase_import = 'ok'

    // 2) pending_orders tablosu erişimi
    try {
      const { error } = await supabaseAdmin.from('pending_orders').select('conversation_id').limit(1)
      rapor.adimlar.pending_orders = error ? `HATA: ${error.message}` : 'ok'
    } catch (e) {
      rapor.adimlar.pending_orders = `EXCEPTION: ${e?.message}`
    }

    // 3) orders tablosu erişimi
    try {
      const { error } = await supabaseAdmin.from('orders').select('siparis_no').limit(1)
      rapor.adimlar.orders = error ? `HATA: ${error.message}` : 'ok'
    } catch (e) {
      rapor.adimlar.orders = `EXCEPTION: ${e?.message}`
    }
  } catch (e) {
    rapor.adimlar.supabase_import = `EXCEPTION: ${e?.message}`
  }

  // 4) rateLimit
  try {
    const { rateLimit } = await import('@/lib/rateLimit')
    const r = await rateLimit('debug-odeme-test', 5, 60_000)
    rapor.adimlar.rateLimit = r.ok ? 'ok' : 'limit doldu'
  } catch (e) {
    rapor.adimlar.rateLimit = `EXCEPTION: ${e?.message}`
  }

  // 5) iyzipay require
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Iyzipay = require('iyzipay')
    const client = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    })
    rapor.adimlar.iyzipay_client = 'ok'

    // 6) iyzipay bağlantı testi (apiTest.retrieve)
    try {
      const pingSonuc = await new Promise((resolve) => {
        if (!client.apiTest?.retrieve) {
          resolve({ skip: 'apiTest yok' })
          return
        }
        client.apiTest.retrieve({ locale: 'tr' }, (err, result) => {
          if (err) resolve({ hata: err?.message || String(err), kod: err?.code })
          else resolve({ status: result?.status, errorCode: result?.errorCode, errorMessage: result?.errorMessage })
        })
      })
      rapor.adimlar.iyzipay_ping = pingSonuc
    } catch (e) {
      rapor.adimlar.iyzipay_ping = `EXCEPTION: ${e?.message}`
    }
  } catch (e) {
    rapor.adimlar.iyzipay_client = `EXCEPTION: ${e?.message}`
  }

  return NextResponse.json(rapor, { status: 200 })
}

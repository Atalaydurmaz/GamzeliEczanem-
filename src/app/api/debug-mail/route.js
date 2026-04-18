import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// TEŞHİS: /api/admin/check/mail-test
// Sadece dev ortamında çalışır. SMTP bağlantısını test eder ve
// bir test maili gönderir. Hatanın gerçek sebebini loglayarak döndürür.

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ hata: 'Yalnızca development' }, { status: 403 })
  }

  const env = {
    SMTP_HOST: process.env.SMTP_HOST || '(eksik)',
    SMTP_PORT: process.env.SMTP_PORT || '(eksik)',
    SMTP_SECURE: process.env.SMTP_SECURE || '(eksik)',
    SMTP_USER: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : '(eksik)',
    SMTP_PASS_len: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ ok: false, asama: 'env', env, hata: 'SMTP env eksik' })
  }

  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: true,
    debug: true,
  })

  try {
    await t.verify()
  } catch (err) {
    return NextResponse.json({
      ok: false, asama: 'verify', env,
      hata: err?.message,
      kod: err?.code,
      komut: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
    })
  }

  try {
    const info = await t.sendMail({
      from: `"GAMZELİECZANEM TEST" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: '✅ SMTP test maili',
      html: `<p>Bu bir test mailidir. Alındıysa SMTP çalışıyor.</p><p>Zaman: ${new Date().toLocaleString('tr-TR')}</p>`,
    })
    return NextResponse.json({
      ok: true, asama: 'send', env,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false, asama: 'send', env,
      hata: err?.message,
      kod: err?.code,
      komut: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
    })
  }
}

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/odeme', '/hesabim', '/sepet'],
      },
    ],
    sitemap: 'https://gamzelieczanem.com/sitemap.xml',
  }
}

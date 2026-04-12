import { getProducts } from '@/lib/products'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const kategori = searchParams.get('kategori') || undefined
  try {
    const data = await getProducts({ kategori })
    return Response.json(data, {
      headers: {
        // Fiyat ve stok canlı veri — tarayıcı ve CDN cache'lemesin
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// Test endpoint devre dışı bırakıldı — production'a açık olmamalı
export async function GET() {
  return Response.json({ error: 'Bu endpoint devre dışı.' }, { status: 404 })
}

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://vetra.asia/</loc></url>
  <url><loc>https://vetra.asia/about</loc></url>
  <url><loc>https://vetra.asia/projects</loc></url>
  <url><loc>https://vetra.asia/services</loc></url>
  <url><loc>https://vetra.asia/contact</loc></url>
</urlset>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

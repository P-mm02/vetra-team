export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://vetra.asia/</loc></url>
  <url><loc>https://vetra.asia/about</loc></url>
  <url><loc>https://vetra.asia/projects</loc></url>
  <url><loc>https://vetra.asia/services</loc></url>
  <url><loc>https://vetra.asia/contact</loc></url>
  <url><loc>https://vetra.asia/privacy</loc></url>
  <url><loc>https://vetra.asia/terms</loc></url>
  <url><loc>https://vetra.asia/en</loc></url>
  <url><loc>https://vetra.asia/en/about</loc></url>
  <url><loc>https://vetra.asia/en/projects</loc></url>
  <url><loc>https://vetra.asia/en/services</loc></url>
  <url><loc>https://vetra.asia/en/contact</loc></url>
  <url><loc>https://vetra.asia/en/privacy</loc></url>
  <url><loc>https://vetra.asia/en/terms</loc></url>
</urlset>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

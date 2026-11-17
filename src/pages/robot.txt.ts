import type { APIRoute } from 'astro'

function getRobotsTxt(sitemapURL: URL) {
  return `
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`
}

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site)
  return new Response(getRobotsTxt(sitemapURL))
}

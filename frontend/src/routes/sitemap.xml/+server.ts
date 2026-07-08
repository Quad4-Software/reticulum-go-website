import { SITE_URL } from '$lib/site-config';
import { SITEMAP_PATHS } from '$lib/sitemap-paths';

export const prerender = true;

export function GET() {
	const urls = SITEMAP_PATHS.map(
		(path) =>
			`  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : path === '/docs/overview' ? '0.9' : '0.8'}</priority>
  </url>`
	).join('\n');

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
}

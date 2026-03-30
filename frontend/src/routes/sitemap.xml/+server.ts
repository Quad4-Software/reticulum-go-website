import { SITE_URL } from '$lib/site-config';

export const prerender = true;

export const SITEMAP_PATHS = [
	'/',
	'/docs',
	'/docs/introduction',
	'/docs/usage',
	'/interactive',
	'/apps',
	'/contact',
	'/donate',
	'/wasm-example',
	'/identity',
	'/settings',
	'/wasm-example/identity',
	'/wasm-example/settings'
] as const;

export function GET() {
	const urls = SITEMAP_PATHS.map(
		(path) =>
			`  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : path === '/docs' ? '0.9' : '0.8'}</priority>
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

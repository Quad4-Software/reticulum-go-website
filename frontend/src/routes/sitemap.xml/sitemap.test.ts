import { describe, it, expect } from 'vitest';
import { SITE_URL } from '$lib/site-config';
import { GET, SITEMAP_PATHS } from './+server';

describe('GET /sitemap.xml', () => {
	it('returns XML with one entry per sitemap path', async () => {
		const res = GET();
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toContain('application/xml');
		const body = await res.text();
		expect(body).toContain('<?xml');
		expect(body).toContain('<urlset');
		const urlTags = body.match(/<url>/g) ?? [];
		expect(urlTags.length).toBe(SITEMAP_PATHS.length);
	});

	it('lists absolute URLs for each path', async () => {
		const body = await GET().text();
		for (const path of SITEMAP_PATHS) {
			expect(body).toContain(`${SITE_URL}${path}`);
		}
	});

	it('uses higher priority for home and docs index', async () => {
		const body = await GET().text();
		expect(body).toContain('<priority>1.0</priority>');
		expect(body).toContain('<priority>0.9</priority>');
		expect(body).toContain(`<loc>${SITE_URL}/docs</loc>`);
	});
});

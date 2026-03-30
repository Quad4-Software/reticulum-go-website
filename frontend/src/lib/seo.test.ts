import { describe, it, expect } from 'vitest';
import { SITE_URL } from './site-config';
import {
	buildJsonLd,
	getBreadcrumbJsonLd,
	getCanonicalUrl,
	getHreflangLinks,
	getOrganizationJsonLd,
	getSoftwareApplicationJsonLd,
	getWebSiteJsonLd,
	jsonLdScript
} from './seo';

describe('seo', () => {
	it('jsonLdScript wraps JSON-LD in a script tag', () => {
		const out = jsonLdScript('{}');
		expect(out).toContain('application/ld+json');
		expect(out).toContain('{}');
	});

	it('buildJsonLd includes schema.org context and type', () => {
		const raw = buildJsonLd('Organization', { name: 'Test' });
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		expect(parsed['@context']).toBe('https://schema.org');
		expect(parsed['@type']).toBe('Organization');
		expect(parsed.name).toBe('Test');
	});

	it('getCanonicalUrl normalizes paths', () => {
		expect(getCanonicalUrl('/docs')).toBe(`${SITE_URL}/docs`);
		expect(getCanonicalUrl('docs')).toBe(`${SITE_URL}/docs`);
	});

	it('getHreflangLinks includes x-default and every locale', () => {
		const links = getHreflangLinks('/foo');
		const langs = links.map((l) => l.lang);
		expect(langs).toContain('x-default');
		expect(langs.some((l) => l.startsWith('x-') && l !== 'x-default')).toBe(false);
		expect(links.find((l) => l.lang === 'en')?.href).toContain('?lang=en');
	});

	it('JSON-LD helpers return parseable JSON', () => {
		for (const fn of [getOrganizationJsonLd, getSoftwareApplicationJsonLd, getWebSiteJsonLd]) {
			expect(() => JSON.parse(fn())).not.toThrow();
		}
	});

	it('getBreadcrumbJsonLd encodes positions and URLs', () => {
		const raw = getBreadcrumbJsonLd([
			{ name: 'Home', url: `${SITE_URL}/` },
			{ name: 'Docs', url: `${SITE_URL}/docs` }
		]);
		const parsed = JSON.parse(raw) as {
			'@type': string;
			itemListElement: { position: number; name: string; item: string }[];
		};
		expect(parsed['@type']).toBe('BreadcrumbList');
		expect(parsed.itemListElement).toHaveLength(2);
		expect(parsed.itemListElement[0].position).toBe(1);
		expect(parsed.itemListElement[1].position).toBe(2);
		expect(parsed.itemListElement[0].name).toBe('Home');
	});
});

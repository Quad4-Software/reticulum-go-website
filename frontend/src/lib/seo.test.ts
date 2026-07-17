import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_DESCRIPTION, SITE_URL } from './site-config';
import {
	buildJsonLd,
	getBreadcrumbJsonLd,
	getCanonicalUrl,
	getDonateWebPageJsonLd,
	getPrivacyWebPageJsonLd,
	getHreflangLinks,
	getOrganizationJsonLd,
	getSoftwareApplicationJsonLd,
	getWebSiteJsonLd,
	jsonLdScript,
	RETICULUM_SITE
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
		for (const fn of [
			getOrganizationJsonLd,
			getSoftwareApplicationJsonLd,
			getWebSiteJsonLd,
			getDonateWebPageJsonLd
		]) {
			expect(() => JSON.parse(fn())).not.toThrow();
		}
	});

	it('software JSON-LD credits Mark Qvist and reticulum.network', () => {
		const parsed = JSON.parse(getSoftwareApplicationJsonLd()) as {
			description: string;
			isBasedOn: { url: string; author: { name: string } };
			sameAs: string[];
			license: string;
		};
		expect(parsed.description).toBe(SITE_DESCRIPTION);
		expect(parsed.isBasedOn.url).toBe(RETICULUM_SITE);
		expect(parsed.isBasedOn.author.name).toBe('Mark Qvist');
		expect(parsed.sameAs).toContain(RETICULUM_SITE);
		expect(parsed.license).toContain('LICENSE-2.0');
	});

	it('donate JSON-LD mentions the Mark Qvist share', () => {
		const parsed = JSON.parse(getDonateWebPageJsonLd()) as {
			url: string;
			description: string;
			about: { name: string; url: string };
		};
		expect(parsed.url).toBe(`${SITE_URL}/donate`);
		expect(parsed.description).toMatch(/Half of donations|Mark Qvist/);
		expect(parsed.about.name).toBe('Mark Qvist');
		expect(parsed.about.url).toBe(RETICULUM_SITE);
	});

	it('privacy JSON-LD states zero data collection', () => {
		const parsed = JSON.parse(getPrivacyWebPageJsonLd()) as {
			url: string;
			description: string;
			name: string;
		};
		expect(parsed.url).toBe(`${SITE_URL}/privacy`);
		expect(parsed.name).toMatch(/Privacy/i);
		expect(parsed.description).toMatch(/zero personal data/i);
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

	it('keeps app.html meta description aligned with site-config', () => {
		const appHtml = readFileSync(resolve(import.meta.dirname, '../app.html'), 'utf8');
		expect(appHtml).toContain(SITE_DESCRIPTION);
		expect(appHtml).toContain('og:description');
		expect(appHtml).toContain('twitter:description');
	});

	it('points security.txt Contact at the LXMF address', () => {
		const securityTxt = readFileSync(
			resolve(import.meta.dirname, '../../static/.well-known/security.txt'),
			'utf8'
		);
		expect(securityTxt).toContain('Contact: lxmf:f489752fbef161c64d65e385a4e9fc74');
		expect(securityTxt).not.toContain('mailto:security@quad4.io');
	});

	it('advertises llms.txt on the website JSON-LD', () => {
		const parsed = JSON.parse(getWebSiteJsonLd()) as { relatedLink?: string[] };
		expect(parsed.relatedLink).toContain(`${SITE_URL}/llms.txt`);
		expect(parsed.relatedLink).toContain(`${SITE_URL}/api/agent`);
	});
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

function read(rel: string) {
	return readFileSync(resolve(root, rel), 'utf8');
}

describe('layout interactivity', () => {
	it('keeps CSR enabled so docs search and export hydrate', () => {
		const source = read('src/routes/+layout.ts');
		expect(source).toMatch(/export const csr = true/);
		expect(source).not.toMatch(/export const csr = false/);
	});
});

describe('docs page chrome', () => {
	it('places export controls on the same row as breadcrumbs', () => {
		const source = read('src/routes/docs/[...slug]/+page.svelte');
		expect(source).toMatch(/sm:flex-row sm:items-center sm:justify-between/);
		expect(source).toMatch(/<Breadcrumbs/);
		expect(source).toMatch(/common\.export/);
		const breadcrumbIndex = source.indexOf('<Breadcrumbs');
		const exportIndex = source.indexOf('common.export');
		const rowOpen = source.indexOf('sm:flex-row sm:items-center sm:justify-between');
		expect(rowOpen).toBeGreaterThan(-1);
		expect(breadcrumbIndex).toBeGreaterThan(rowOpen);
		expect(exportIndex).toBeGreaterThan(breadcrumbIndex);
	});

	it('prefers startup-cached HTML when present', () => {
		const page = read('src/routes/docs/[...slug]/+page.svelte');
		const load = read('src/routes/docs/[...slug]/+page.ts');
		const server = read('src/routes/docs/[...slug]/+page.server.ts');
		expect(server).toContain('getCachedDocMarkdown');
		expect(load).toContain('data.cachedHtml');
		expect(page).toContain('{@html data.html}');
	});

	it('avoids nested main landmarks and eager docs search', () => {
		const docsLayout = read('src/routes/docs/+layout.svelte');
		const search = read('src/lib/components/Search.svelte');
		expect(docsLayout).not.toMatch(/<main\b/);
		expect(search).not.toContain('eager: true');
		expect(search).toContain("import.meta.glob('../../lib/docs/**/*.{md,mdx}'");
	});
});

describe('home copy', () => {
	it('avoids over-specific marketing phrases and uses coexistence title', () => {
		const en = JSON.parse(read('src/lib/i18n/locales/en.json')) as {
			home: {
				features: { interop: { description: string }; modular: { description: string } };
				coexistence: { title: string; description: string };
			};
		};

		expect(en.home.features.interop.description).not.toMatch(/translation gateways/i);
		expect(en.home.features.modular.description).not.toMatch(/Layered packages/i);
		expect(en.home.coexistence.title).toBe("Expanding Reticulum's Reach");
		expect(en.home.coexistence.description).toMatch(/Mark Qvist/);
		expect(en.home.coexistence.description).toMatch(/not to replace it/);
	});

	it('keeps locale feature keys aligned', () => {
		for (const locale of ['en', 'de', 'ru', 'it']) {
			const data = JSON.parse(read(`src/lib/i18n/locales/${locale}.json`)) as {
				home: {
					features: Record<string, { title: string; description: string }>;
					coexistence: { title: string; description: string };
				};
			};
			for (const key of ['encrypted', 'resilient', 'go', 'interop', 'sandbox', 'modular']) {
				expect(data.home.features[key]?.title).toBeTruthy();
				expect(data.home.features[key]?.description).toBeTruthy();
			}
			expect(data.home.coexistence.title).toBeTruthy();
			expect(data.home.coexistence.description).toBeTruthy();
		}
	});
});

describe('theme FOUC bootstrap', () => {
	it('reads theme cookie before localStorage', () => {
		const html = read('src/app.html');
		expect(html).toMatch(/cookieTheme/);
		expect(html).toMatch(/cookieTheme\(\) \|\| localStorage\.getItem\('theme'\)/);
	});

	it('enables viewport-fit cover for safe-area insets', () => {
		const html = read('src/app.html');
		expect(html).toContain('viewport-fit=cover');
	});
});

describe('docs mobile chrome', () => {
	it('keeps docs nav behind a mobile drawer', () => {
		const source = read('src/routes/docs/+layout.svelte');
		expect(source).toContain('mobileMenuOpen');
		expect(source).toContain('docs_menu');
		expect(source).toContain('max-h-[calc(100dvh-7rem)]');
	});
});

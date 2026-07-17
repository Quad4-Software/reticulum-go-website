import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir, { withFileTypes: true })) {
		const full = resolve(dir, name.name);
		if (name.isDirectory()) out.push(...walk(full));
		else out.push(full);
	}
	return out;
}

describe('rnode flasher regressions', () => {
	it('wires the tools route sitemap and alpha catalog entry', () => {
		const toolsPage = readFileSync(resolve(root, 'routes/tools/+page.svelte'), 'utf8');
		const sitemap = readFileSync(resolve(root, 'lib/sitemap-paths.ts'), 'utf8');
		const routePage = readFileSync(
			resolve(root, 'routes/tools/rnode-flasher/+page.svelte'),
			'utf8'
		);
		expect(toolsPage).toContain("href: '/tools/rnode-flasher'");
		expect(toolsPage).toMatch(/id: 'rnode-flasher'[\s\S]*?status: 'alpha'/);
		expect(sitemap).toContain('/tools/rnode-flasher');
		expect(routePage).toContain('FlasherApp');
	});

	it('does not handroll SVG icons in flasher components', () => {
		const dir = resolve(root, 'lib/components/rnode-flasher');
		for (const file of walk(dir).filter((f) => f.endsWith('.svelte'))) {
			const src = readFileSync(file, 'utf8');
			expect(src).not.toMatch(/<svg[\s>]/);
			if (file.endsWith('SupportedBrowsers.svelte')) {
				expect(src).toContain('/browser-icons/');
				expect(src).toContain('group-hover:opacity-100');
			} else {
				expect(src).toMatch(/lucide-svelte/);
			}
		}
	});

	it('vendors chromium browser favicons for the support strip', () => {
		const icons = resolve(root, '../static/browser-icons');
		for (const name of ['chrome.svg', 'edge.svg', 'brave.svg', 'opera.svg']) {
			const src = readFileSync(resolve(icons, name), 'utf8');
			expect(src).toContain('<svg');
			expect(src).toContain('viewBox');
		}
	});

	it('ships a bundled catalog with Tiny-Reticulum-Go coming soon', () => {
		const catalog = JSON.parse(
			readFileSync(resolve(root, '../static/rnode-firmware/catalog.json'), 'utf8')
		) as {
			entries: Array<{ source: string; comingSoon?: boolean; path?: string; version?: string }>;
			sources?: { official?: { repo?: string }; microreticulum?: { repo?: string } };
		};
		expect(catalog.entries.some((e) => e.source === 'official')).toBe(true);
		expect(catalog.entries.some((e) => e.source === 'microreticulum')).toBe(true);
		expect(
			catalog.entries.some((e) => e.source === 'tiny-reticulum-go' && e.comingSoon === true)
		).toBe(true);
		expect(catalog.entries.some((e) => (e.path || '').includes('demo'))).toBe(false);
		expect(catalog.entries.some((e) => (e.version || '').includes('demo'))).toBe(false);
		expect(catalog.sources?.official?.repo).toBe('markqvist/RNode_Firmware');
		expect(catalog.sources?.microreticulum?.repo).toBe('attermann/microReticulum_Firmware');
	});

	it('caches rnode-firmware assets in the PWA workbox config', () => {
		const vite = readFileSync(resolve(root, '../vite.config.ts'), 'utf8');
		expect(vite).toContain('/rnode-firmware/');
		expect(vite).toContain("cacheName: 'rnode-firmware'");
	});
});

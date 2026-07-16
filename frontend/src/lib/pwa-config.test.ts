import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const viteConfigPath = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../vite.config.ts'
);

describe('PWA production config', () => {
	it('auto-updates the service worker and prefers network for navigations', () => {
		const source = readFileSync(viteConfigPath, 'utf8');
		expect(source).toContain("registerType: 'autoUpdate'");
		expect(source).toContain('skipWaiting: true');
		expect(source).toContain("handler: 'NetworkFirst'");
		expect(source).toContain("request.mode === 'navigate'");
		expect(source).toContain("cacheName: 'pages'");
	});

	it('caches navigations including docs and tools pages at runtime', () => {
		const source = readFileSync(viteConfigPath, 'utf8');
		expect(source).toMatch(
			/urlPattern:\s*\(\{\s*request\s*\}\)\s*=>\s*request\.mode\s*===\s*'navigate'/
		);
		expect(source).toContain('NetworkFirst');
		expect(source).toContain('maxEntries: 48');
		expect(source).toContain('networkTimeoutSeconds: 5');
	});

	it('cache-firsts WASM assets for offline tools', () => {
		const source = readFileSync(viteConfigPath, 'utf8');
		expect(source).toContain("cacheName: 'wasm-assets'");
		expect(source).toContain("handler: 'CacheFirst'");
		expect(source).toContain(".endsWith('.wasm')");
		expect(source).toContain('/wasm_exec.js');
		expect(source).toContain('client/**/*.{js,css,ico,png,svg,webp,webmanifest,wasm}');
		expect(source).toContain('VITE_WASM_SRI');
	});
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const layoutDir = path.dirname(fileURLToPath(import.meta.url));

describe('root layout', () => {
	it('does not gate the shell on client i18n loading', () => {
		const layoutSource = readFileSync(path.join(layoutDir, '+layout.svelte'), 'utf8');
		expect(layoutSource).not.toContain('isLoading');
		expect(layoutSource).not.toContain('animate-pulse');
	});

	it('waits for locale in universal load before hydration', () => {
		const loadSource = readFileSync(path.join(layoutDir, '+layout.ts'), 'utf8');
		expect(loadSource).toContain('waitLocale');
		expect(loadSource).toContain('data.currentLocale');
	});

	it('uses dvh shell height to avoid mobile viewport chrome gaps', () => {
		const layoutSource = readFileSync(path.join(layoutDir, '+layout.svelte'), 'utf8');
		expect(layoutSource).toContain('min-h-dvh');
		expect(layoutSource).not.toContain('overflow-x-clip');
	});

	it('hides site chrome in micron editor popout mode', () => {
		const layoutSource = readFileSync(path.join(layoutDir, '+layout.svelte'), 'utf8');
		expect(layoutSource).toContain("searchParams.get('popout') === '1'");
		expect(layoutSource).toContain('isPopout');
	});

	it('provides a skip link to main content', () => {
		const layoutSource = readFileSync(path.join(layoutDir, '+layout.svelte'), 'utf8');
		expect(layoutSource).toContain('href="#main-content"');
		expect(layoutSource).toContain('id="main-content"');
		expect(layoutSource).toContain('Skip to content');
	});
});

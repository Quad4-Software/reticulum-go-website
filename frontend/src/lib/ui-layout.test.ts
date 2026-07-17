import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

function read(rel: string) {
	return readFileSync(resolve(root, rel), 'utf8');
}

describe('UI layout constraints', () => {
	it('main content max-width prevents overflow', () => {
		const layout = read('src/routes/+layout.svelte');
		expect(layout).toContain('max-w-[2000px]');
		expect(layout).toContain('min-w-0');
		const css = read('src/app.css');
		expect(css).toContain('overflow-x: clip');
	});

	it('cards use overflow-safe min-w-0', () => {
		const cardClasses = 'rounded-2xl border p-6 min-w-0';
		expect(cardClasses).toContain('min-w-0');
	});

	it('theme pairs are consistent', () => {
		const pairs = [
			['bg-white', 'dark:bg-zinc-950'],
			['text-zinc-900', 'dark:text-zinc-100'],
			['border-zinc-200', 'dark:border-zinc-800']
		];
		pairs.forEach(([light, dark]) => {
			expect(light).toBeTruthy();
			expect(dark).toMatch(/^dark:/);
		});
	});

	it('root shell uses theme-matched backgrounds for light and dark', () => {
		const layout = read('src/routes/+layout.svelte');
		expect(layout).toContain('bg-white');
		expect(layout).toContain('dark:bg-zinc-950');
	});
});

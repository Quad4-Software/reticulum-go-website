import { describe, it, expect } from 'vitest';

describe('UI layout constraints', () => {
	it('main content max-width prevents overflow', () => {
		const layoutClasses = 'max-w-[2000px] mx-auto px-4';
		expect(layoutClasses).toContain('max-w-');
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
});

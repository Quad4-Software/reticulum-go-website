import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSource = readFileSync(
	resolve(import.meta.dirname, '../../routes/apps/+page.svelte'),
	'utf8'
);

describe('apps catalog', () => {
	it('lists Ren Chat, Ren Store, and Strata API Framework as coming soon', () => {
		for (const name of ['Ren Chat', 'Ren Store', 'Strata API Framework']) {
			expect(pageSource).toContain(`name: '${name}'`);
		}
		expect(pageSource).toMatch(/name: 'Ren Chat'[\s\S]*?status: 'coming-soon'/);
		expect(pageSource).toMatch(/name: 'Ren Store'[\s\S]*?status: 'coming-soon'/);
		expect(pageSource).toMatch(/name: 'Strata API Framework'[\s\S]*?status: 'coming-soon'/);
	});
});

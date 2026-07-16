import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSource = readFileSync(resolve(import.meta.dirname, './+page.svelte'), 'utf8');

describe('donate page', () => {
	it('states that half of donations go to Mark Qvist with a reticulum.network link', () => {
		expect(pageSource).toContain('donate.markqvist_share');
		expect(pageSource).toContain('donate.markqvist_link');
		expect(pageSource).toContain('RETICULUM_SITE');
		expect(pageSource).toContain('getDonateWebPageJsonLd');
		expect(pageSource).toContain('og:description');
	});
});

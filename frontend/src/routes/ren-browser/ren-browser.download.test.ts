import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');

function read(path: string): string {
	return readFileSync(resolve(root, path), 'utf8');
}

describe('ren browser download page wiring', () => {
	it('links overview CTAs to the download page', () => {
		const page = read('src/routes/ren-browser/+page.svelte');
		expect(page).toContain('href="/ren-browser/download"');
		expect(page).not.toContain('releases/latest');
	});

	it('loads cached releases on the download route', () => {
		const server = read('src/routes/ren-browser/download/+page.server.ts');
		expect(server).toContain('getRenBrowserReleases');
		const page = read('src/routes/ren-browser/download/+page.svelte');
		expect(page).toContain('detectClientPlatform');
		expect(page).toContain('DOWNLOAD_SLOTS');
	});
});

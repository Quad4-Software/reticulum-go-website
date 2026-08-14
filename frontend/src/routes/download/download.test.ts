import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');

function read(path: string): string {
	return readFileSync(resolve(root, path), 'utf8');
}

describe('reticulum-go download wiring', () => {
	it('links homepage hero to /download', () => {
		const home = read('src/routes/+page.svelte');
		expect(home).toContain('href="/download"');
		expect(home).toContain("{$t('home.download')}");
	});

	it('loads cached releases on /download', () => {
		const server = read('src/routes/download/+page.server.ts');
		expect(server).toContain('getReticulumGoReleases');
		const page = read('src/routes/download/+page.svelte');
		expect(page).toContain('detectClientPlatform');
		expect(page).toContain('RG_DOWNLOAD_SLOTS');
	});
});

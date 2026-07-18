import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	RETICULUM_GO_GITHUB,
	RETICULUM_GO_LAVAFORGE,
	RETICULUM_GO_RNS_CLONE,
	RETICULUM_GO_RNGIT_PAGE,
	RETICULUM_GO_SOURCE_ZIP_PATH
} from '$lib/source-mirrors';

const root = resolve(import.meta.dirname, '../../..');

function read(rel: string) {
	return readFileSync(resolve(root, rel), 'utf8');
}

describe('source page', () => {
	it('exposes official and mirror hubs plus site zip download', () => {
		expect(RETICULUM_GO_SOURCE_ZIP_PATH).toBe('/download/reticulum-go.zip');
		expect(RETICULUM_GO_GITHUB).toContain('github.com/Quad4-Software/Reticulum-Go');
		expect(RETICULUM_GO_LAVAFORGE).toContain('lavaforge.org');
		expect(RETICULUM_GO_RNS_CLONE).toContain('git clone rns://');
		expect(RETICULUM_GO_RNGIT_PAGE).toContain(':/page/index.mu');
	});

	it('wires download CTA, copy toast without blue dot, and tight top spacing', () => {
		const page = read('src/routes/source/+page.svelte');
		expect(page).toContain('RETICULUM_GO_SOURCE_ZIP_PATH');
		expect(page).toContain('source.download_zip');
		expect(page).toContain('showDot={false}');
		expect(page).toContain('pt-0 pb-12');
		expect(page).toContain('source.badge_ci_releases');
		expect(page).toContain('onclick={() => copyText(');
	});

	it('loads zip tag metadata on the server', () => {
		const server = read('src/routes/source/+page.server.ts');
		expect(server).toContain('getSourceZipMeta');
		expect(server).toContain('zipTag');
		expect(server).toContain('zipAvailable');
	});
});

describe('startup caches', () => {
	it('hooks fetch source zip and docs on init', () => {
		const hooks = read('src/hooks.server.ts');
		expect(hooks).toContain('ensureSourceZip');
		expect(hooks).toContain('ensureDocsSynced');
		expect(hooks).toContain('export const init');
	});

	it('Dockerfile sets writable cache dirs under /tmp', () => {
		const docker = readFileSync(resolve(root, '../Dockerfile'), 'utf8');
		expect(docker).toContain('SOURCE_ZIP_CACHE_DIR=/tmp/reticulum-go-source-cache');
		expect(docker).toContain('DOCS_CACHE_DIR=/tmp/reticulum-go-docs-cache');
	});
});

describe('homepage platforms', () => {
	it('renders SupportedPlatforms below feature cards', () => {
		const home = read('src/routes/+page.svelte');
		expect(home).toContain('SupportedPlatforms');
		expect(home).toContain('href="/source"');
		const featuresIdx = home.indexOf('home.features');
		const platformsIdx = home.indexOf('<SupportedPlatforms');
		expect(platformsIdx).toBeGreaterThan(featuresIdx);
	});

	it('SupportedPlatforms uses IconCascade', () => {
		const src = read('src/lib/components/SupportedPlatforms.svelte');
		expect(src).toContain('IconCascade');
		expect(src).toContain('home.platforms.title');
	});
});

describe('layout source spacing', () => {
	it('uses tighter top padding on /source', () => {
		const layout = read('src/routes/+layout.svelte');
		expect(layout).toContain('isSourcePage');
		expect(layout).toContain('pt-3 pb-8');
		expect(layout).toContain("pathname === '/source'");
	});
});

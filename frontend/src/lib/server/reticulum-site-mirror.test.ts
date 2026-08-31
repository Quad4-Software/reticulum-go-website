import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import JSZip from 'jszip';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');

describe('reticulum site mirror', () => {
	let cacheRoot: string;
	const originalEnv = process.env.RETICULUM_SITE_MIRROR_CACHE_DIR;

	beforeEach(async () => {
		cacheRoot = await mkdtemp(join(tmpdir(), 'reticulum-mirror-test-'));
		process.env.RETICULUM_SITE_MIRROR_CACHE_DIR = cacheRoot;
		vi.resetModules();
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.RETICULUM_SITE_MIRROR_CACHE_DIR;
		} else {
			process.env.RETICULUM_SITE_MIRROR_CACHE_DIR = originalEnv;
		}
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('registers the reserved mirror routes', () => {
		expect(existsSync(resolve(root, 'src/routes/mirrors/reticulum/+server.ts'))).toBe(true);
		expect(
			existsSync(resolve(root, 'src/routes/mirrors/reticulum/[...path]/+server.ts'))
		).toBe(true);
	});

	it('rejects path traversal', async () => {
		const { resolveMirrorFilePath } = await import('./reticulum-site-mirror');
		expect(resolveMirrorFilePath('../etc/passwd')).toBeNull();
		expect(resolveMirrorFilePath('manual/../../secret')).toBeNull();
	});

	it('injects a slim mirror banner after body', async () => {
		const { injectMirrorBanner } = await import('./reticulum-site-mirror');
		const out = injectMirrorBanner('<html><body><h1>Hi</h1></body></html>', 'zen.html');
		expect(out).toContain('id="rgo-mirror-banner"');
		expect(out).toContain('Unofficial mirror');
		expect(out).toContain('https://reticulum.network/zen.html');
		expect(out.indexOf('rgo-mirror-banner')).toBeLessThan(out.indexOf('<h1>Hi</h1>'));
	});

	it('ensureReticulumSiteMirror extracts docs tree from zipball', async () => {
		const zip = new JSZip();
		zip.file('markqvist-reticulum_website-abc123/LICENSE', 'Reticulum License');
		zip.file(
			'markqvist-reticulum_website-abc123/docs/index.html',
			'<!doctype html><html><body><h1>Home</h1></body></html>'
		);
		zip.file(
			'markqvist-reticulum_website-abc123/docs/manual/zen.html',
			'<!doctype html><html><body><h1>Zen</h1></body></html>'
		);
		zip.file('markqvist-reticulum_website-abc123/docs/CNAME', 'reticulum.network');
		const zipBytes = await zip.generateAsync({ type: 'uint8array' });

		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/commits/master')) {
					return new Response(JSON.stringify({ sha: 'deadbeefcafebabe' }), { status: 200 });
				}
				if (url.includes('/zipball/')) {
					return new Response(zipBytes, { status: 200 });
				}
				return new Response('not found', { status: 404 });
			})
		);

		const {
			ensureReticulumSiteMirror,
			getReticulumSiteMirrorMeta,
			openMirrorAsset
		} = await import('./reticulum-site-mirror');

		const meta = await ensureReticulumSiteMirror();
		expect(meta?.sha).toBe('deadbeefcafebabe');
		expect(meta?.fileCount).toBeGreaterThanOrEqual(3);
		expect((await getReticulumSiteMirrorMeta())?.sha).toBe('deadbeefcafebabe');

		const home = await openMirrorAsset('');
		expect(home?.isHtml).toBe(true);
		expect(home?.bytes.toString('utf8')).toContain('<h1>Home</h1>');

		const zen = await openMirrorAsset('manual/zen.html');
		expect(zen?.bytes.toString('utf8')).toContain('<h1>Zen</h1>');

		const siteIndex = await readFile(join(cacheRoot, 'site', 'index.html'), 'utf8');
		expect(siteIndex).toContain('Home');
		await expect(readFile(join(cacheRoot, 'site', 'CNAME'), 'utf8')).rejects.toThrow();
	});

	it('reuses cache when SHA is unchanged', async () => {
		await mkdir(join(cacheRoot, 'site'), { recursive: true });
		await writeFile(join(cacheRoot, 'site', 'index.html'), '<html><body>cached</body></html>');
		await writeFile(
			join(cacheRoot, 'meta.json'),
			JSON.stringify({
				sha: 'same-sha',
				fetchedAt: '2026-08-30T00:00:00.000Z',
				fileCount: 1,
				bytes: 10,
				sourceUrl: 'https://example.test',
				upstream: 'https://reticulum.network',
				repo: 'https://github.com/markqvist/reticulum_website'
			})
		);

		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes('/commits/master')) {
				return new Response(JSON.stringify({ sha: 'same-sha' }), { status: 200 });
			}
			throw new Error(`unexpected fetch ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);

		const { ensureReticulumSiteMirror } = await import('./reticulum-site-mirror');
		const meta = await ensureReticulumSiteMirror();
		expect(meta?.sha).toBe('same-sha');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

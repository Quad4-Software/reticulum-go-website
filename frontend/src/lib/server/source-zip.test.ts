import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('source-zip', () => {
	let cacheRoot: string;
	const originalEnv = process.env.SOURCE_ZIP_CACHE_DIR;

	beforeEach(async () => {
		cacheRoot = await mkdtemp(join(tmpdir(), 'source-zip-test-'));
		process.env.SOURCE_ZIP_CACHE_DIR = cacheRoot;
		vi.resetModules();
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.SOURCE_ZIP_CACHE_DIR;
		} else {
			process.env.SOURCE_ZIP_CACHE_DIR = originalEnv;
		}
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('reads meta when zip and meta.json exist', async () => {
		const filename = 'Reticulum-Go-1.2.3.zip';
		await writeFile(join(cacheRoot, filename), 'PK\x03\x04fake');
		await writeFile(
			join(cacheRoot, 'meta.json'),
			JSON.stringify({
				tag: 'v1.2.3',
				fetchedAt: '2026-07-18T00:00:00.000Z',
				filename,
				bytes: 10,
				sourceUrl: 'https://example.test/zip'
			})
		);

		const { getSourceZipMeta } = await import('./source-zip');
		const meta = await getSourceZipMeta();
		expect(meta?.tag).toBe('v1.2.3');
		expect(meta?.filename).toBe(filename);
	});

	it('returns null when meta is missing', async () => {
		await mkdir(cacheRoot, { recursive: true });
		const { getSourceZipMeta } = await import('./source-zip');
		expect(await getSourceZipMeta()).toBeNull();
	});

	it('ensureSourceZip caches latest tag zip from GitHub API', async () => {
		const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01, 0x02, 0x03]);
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/tags?')) {
					return new Response(JSON.stringify([{ name: 'v9.9.9' }]), { status: 200 });
				}
				if (url.includes('/zipball/')) {
					return new Response(zipBytes, { status: 200 });
				}
				return new Response('not found', { status: 404 });
			})
		);

		const { ensureSourceZip, getSourceZipMeta } = await import('./source-zip');
		const meta = await ensureSourceZip();
		expect(meta?.tag).toBe('v9.9.9');
		expect(meta?.filename).toBe('Reticulum-Go-9.9.9.zip');
		expect(meta?.bytes).toBe(zipBytes.byteLength);

		const again = await getSourceZipMeta();
		expect(again?.tag).toBe('v9.9.9');
	});

	it('ensureSourceZip reuses cache when tag unchanged', async () => {
		const filename = 'Reticulum-Go-3.0.0.zip';
		await writeFile(join(cacheRoot, filename), 'PK\x03\x04cached');
		await writeFile(
			join(cacheRoot, 'meta.json'),
			JSON.stringify({
				tag: 'v3.0.0',
				fetchedAt: '2026-07-18T00:00:00.000Z',
				filename,
				bytes: 10,
				sourceUrl: 'https://example.test/zip'
			})
		);

		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes('/tags?')) {
				return new Response(JSON.stringify([{ name: 'v3.0.0' }]), { status: 200 });
			}
			throw new Error(`unexpected fetch ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);

		const { ensureSourceZip } = await import('./source-zip');
		const meta = await ensureSourceZip();
		expect(meta?.tag).toBe('v3.0.0');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

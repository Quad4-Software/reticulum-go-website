import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('GET /download/reticulum-go.zip', () => {
	let cacheRoot: string;
	const originalEnv = process.env.SOURCE_ZIP_CACHE_DIR;

	beforeEach(async () => {
		cacheRoot = await mkdtemp(join(tmpdir(), 'zip-route-test-'));
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

	it('returns JSON meta when meta=1 and cache exists', async () => {
		const filename = 'Reticulum-Go-1.0.0.zip';
		await writeFile(join(cacheRoot, filename), 'PK\x03\x04zip');
		await writeFile(
			join(cacheRoot, 'meta.json'),
			JSON.stringify({
				tag: 'v1.0.0',
				fetchedAt: '2026-07-18T00:00:00.000Z',
				filename,
				bytes: 8,
				sourceUrl: 'https://example.test/zip'
			})
		);

		const { GET } = await import('./+server');
		const res = await GET({
			url: new URL('http://localhost/download/reticulum-go.zip?meta=1')
		} as never);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.available).toBe(true);
		expect(body.tag).toBe('v1.0.0');
	});

	it('streams zip with attachment headers when cache exists', async () => {
		const filename = 'Reticulum-Go-2.0.0.zip';
		const bytes = Buffer.from('PK\x03\x04zipdata');
		await writeFile(join(cacheRoot, filename), bytes);
		await writeFile(
			join(cacheRoot, 'meta.json'),
			JSON.stringify({
				tag: 'v2.0.0',
				fetchedAt: '2026-07-18T00:00:00.000Z',
				filename,
				bytes: bytes.byteLength,
				sourceUrl: 'https://example.test/zip'
			})
		);

		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/tags?')) {
					return new Response(JSON.stringify([{ name: 'v2.0.0' }]), { status: 200 });
				}
				return new Response('nope', { status: 404 });
			})
		);

		const { GET } = await import('./+server');
		const res = await GET({
			url: new URL('http://localhost/download/reticulum-go.zip')
		} as never);
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('application/zip');
		expect(res.headers.get('Content-Disposition')).toContain(filename);
		expect(res.headers.get('X-Source-Tag')).toBe('v2.0.0');
		const ab = await res.arrayBuffer();
		expect(Buffer.from(ab).equals(bytes)).toBe(true);
	});

	it('returns 503 meta when cache is empty', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('[]', { status: 200 }))
		);
		const { GET } = await import('./+server');
		const res = await GET({
			url: new URL('http://localhost/download/reticulum-go.zip?meta=1')
		} as never);
		expect(res.status).toBe(503);
		const body = await res.json();
		expect(body.available).toBe(false);
	});
});

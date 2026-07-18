import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('docs-sync', () => {
	let cacheRoot: string;
	const originalEnv = process.env.DOCS_CACHE_DIR;

	beforeEach(async () => {
		cacheRoot = await mkdtemp(join(tmpdir(), 'docs-sync-test-'));
		process.env.DOCS_CACHE_DIR = cacheRoot;
		vi.resetModules();
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.DOCS_CACHE_DIR;
		} else {
			process.env.DOCS_CACHE_DIR = originalEnv;
		}
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('rewriteDocLinks converts sibling md links and repo root links', async () => {
		const { rewriteDocLinks } = await import('./docs-sync');
		const input = [
			'See [Architecture](architecture.md#layers).',
			'Read [README](../../README.md).',
			'See [COMPATIBILITY](../../COMPATIBILITY.md).',
			'See [SECURITY](../../SECURITY.md).',
			'See [LICENSE](../../LICENSE).'
		].join('\n');
		const out = rewriteDocLinks(input, 'https://github.com/example/repo/blob/master');
		expect(out).toContain('](/docs/architecture#layers)');
		expect(out).toContain('](https://github.com/example/repo/blob/master/README.md)');
		expect(out).toContain('](https://github.com/example/repo/blob/master/COMPATIBILITY.md)');
		expect(out).toContain('](https://github.com/example/repo/blob/master/SECURITY.md)');
		expect(out).toContain('](https://github.com/example/repo/blob/master/LICENSE)');
		expect(out).not.toMatch(/\]\([a-z0-9-]+\.md/);
	});

	it('extractDocTitle reads the first heading', async () => {
		const { extractDocTitle } = await import('./docs-sync');
		expect(extractDocTitle('# Overview\n\nBody', 'overview')).toBe('Overview');
		expect(extractDocTitle('no heading', 'getting-started')).toBe('Getting Started');
	});

	it('ensureDocsSynced downloads and rewrites docs from GitHub', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: RequestInfo | URL) => {
				const url = String(input);
				if (url.includes('/contents/docs/en')) {
					return new Response(
						JSON.stringify([
							{
								name: 'README.md',
								type: 'file',
								download_url: 'https://example.test/README.md'
							},
							{
								name: 'overview.md',
								type: 'file',
								download_url: 'https://example.test/overview.md'
							},
							{
								name: 'architecture.md',
								type: 'file',
								download_url: 'https://example.test/architecture.md'
							}
						]),
						{ status: 200 }
					);
				}
				if (url.endsWith('/overview.md')) {
					return new Response('# Overview\n\nSee [Architecture](architecture.md).', {
						status: 200
					});
				}
				if (url.endsWith('/architecture.md')) {
					return new Response('# Architecture\n\nSee [README](../../README.md).', {
						status: 200
					});
				}
				return new Response('not found', { status: 404 });
			})
		);

		const { ensureDocsSynced, getCachedDocMarkdown, getDocsSyncMeta } = await import('./docs-sync');
		const meta = await ensureDocsSynced();
		expect(meta?.files).toEqual(['architecture.md', 'overview.md']);
		expect(await getDocsSyncMeta()).toEqual(meta);

		const overview = await getCachedDocMarkdown('overview');
		expect(overview).toContain('](/docs/architecture)');
		expect(overview).not.toContain('(architecture.md)');

		const architecture = await getCachedDocMarkdown('architecture');
		expect(architecture).toContain('/blob/master/README.md');
	});

	it('renderDocMarkdown produces HTML', async () => {
		const { renderDocMarkdown } = await import('./docs-sync');
		const html = await renderDocMarkdown('# Hello\n\nParagraph');
		expect(html).toContain('<h1');
		expect(html).toContain('Hello');
		expect(html).toContain('<p>');
	});

	it('getCachedDocMarkdown returns null when missing', async () => {
		const { getCachedDocMarkdown } = await import('./docs-sync');
		expect(await getCachedDocMarkdown('missing')).toBeNull();
	});

	it('returns prior meta when GitHub list fails', async () => {
		await writeFile(
			join(cacheRoot, 'meta.json'),
			JSON.stringify({
				fetchedAt: '2026-07-18T00:00:00.000Z',
				files: ['overview.md'],
				source: 'stale'
			})
		);
		await writeFile(join(cacheRoot, 'overview.md'), '# Overview\n');

		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('nope', { status: 500 }))
		);

		const { ensureDocsSynced } = await import('./docs-sync');
		const meta = await ensureDocsSynced();
		expect(meta?.files).toEqual(['overview.md']);
		expect(meta?.source).toBe('stale');
		expect(await readFile(join(cacheRoot, 'overview.md'), 'utf8')).toContain('# Overview');
	});
});

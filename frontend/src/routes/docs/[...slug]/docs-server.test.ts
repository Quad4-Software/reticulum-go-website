import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('docs slug server load', () => {
	let cacheRoot: string;
	const originalEnv = process.env.DOCS_CACHE_DIR;

	beforeEach(async () => {
		cacheRoot = await mkdtemp(join(tmpdir(), 'docs-page-server-'));
		process.env.DOCS_CACHE_DIR = cacheRoot;
		vi.resetModules();
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.DOCS_CACHE_DIR;
		} else {
			process.env.DOCS_CACHE_DIR = originalEnv;
		}
	});

	it('returns rendered HTML when cached markdown exists', async () => {
		await writeFile(
			join(cacheRoot, 'overview.md'),
			'# Overview\n\nHello [Architecture](/docs/architecture).'
		);
		const { load } = await import('./+page.server');
		const data = (await load({ params: { slug: 'overview' } } as never)) as {
			cachedHtml: string | null;
			cachedTitle: string | null;
		};
		expect(data.cachedHtml).toContain('<h1');
		expect(data.cachedHtml).toContain('Overview');
		expect(data.cachedTitle).toBe('Overview');
	});

	it('returns nulls when cache miss', async () => {
		const { load } = await import('./+page.server');
		const data = (await load({ params: { slug: 'missing-doc' } } as never)) as {
			cachedHtml: string | null;
			cachedTitle: string | null;
		};
		expect(data.cachedHtml).toBeNull();
		expect(data.cachedTitle).toBeNull();
	});
});

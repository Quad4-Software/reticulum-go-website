import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

function createEvent(): RequestEvent {
	return {
		request: new Request('http://localhost/api/reticulum-go/releases'),
		params: {},
		route: { id: '/api/reticulum-go/releases' },
		fetch: globalThis.fetch,
		getClientAddress: () => '',
		cookies: {} as RequestEvent['cookies'],
		locals: {},
		platform: undefined,
		url: new URL('http://localhost/api/reticulum-go/releases'),
		isDataRequest: false,
		setHeaders: () => {},
		depends: () => {},
		parent: () => Promise.resolve({}),
		isSubRequest: false,
		tracing: { enabled: false, root: {} as never, current: {} as never },
		isRemoteRequest: false
	} as RequestEvent;
}

const releasePayload = [
	{
		tag_name: 'v1.0.1',
		name: 'Reticulum-Go 1.0.1',
		published_at: '2026-01-01T00:00:00Z',
		prerelease: false,
		draft: false,
		html_url: 'https://github.com/Quad4-Software/Reticulum-Go/releases/tag/v1.0.1',
		assets: [
			{
				name: 'reticulum-go-linux-amd64',
				size: 100,
				browser_download_url: 'https://example.com/linux-amd64',
				content_type: 'application/octet-stream'
			},
			{
				name: 'reticulum-go-linux-amd64.cosign.bundle',
				size: 10,
				browser_download_url: 'https://example.com/bundle',
				content_type: 'application/octet-stream'
			}
		]
	}
];

describe('GET /api/reticulum-go/releases', () => {
	beforeEach(async () => {
		vi.resetModules();
		vi.stubGlobal('fetch', vi.fn());
		const mod = await import('$lib/server/reticulum-go-releases');
		mod.__resetReticulumGoReleaseCacheForTests();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns stable release without cosign bundles', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => releasePayload
		});
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.stable.tag).toBe('v1.0.1');
		expect(body.stable.assets).toHaveLength(1);
		expect(body.stable.assets[0].name).toBe('reticulum-go-linux-amd64');
	});

	it('reuses cache for 15 minutes', async () => {
		vi.useFakeTimers({ now: 0 });
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => releasePayload
		});
		vi.stubGlobal('fetch', fetchMock);
		const { GET } = await import('./+server');

		await GET(createEvent());
		await GET(createEvent());
		expect(fetchMock).toHaveBeenCalledTimes(1);

		vi.setSystemTime(15 * 60 * 1000 + 1);
		await GET(createEvent());
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('paginates when stable is beyond the first page of pre-releases', async () => {
		const pageOne = Array.from({ length: 12 }, (_, index) => ({
			tag_name: `nightly-${index}`,
			name: `Nightly ${index}`,
			published_at: '2026-01-01T00:00:00Z',
			prerelease: true,
			draft: false,
			html_url: `https://github.com/Quad4-Software/Reticulum-Go/releases/tag/nightly-${index}`,
			assets: []
		}));
		const pageTwo = [
			{
				tag_name: 'v1.0.0',
				name: 'Reticulum-Go 1.0.0',
				published_at: '2026-01-01T00:00:00Z',
				prerelease: false,
				draft: false,
				html_url: 'https://github.com/Quad4-Software/Reticulum-Go/releases/tag/v1.0.0',
				assets: releasePayload[0].assets
			}
		];
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, json: async () => pageOne })
			.mockResolvedValueOnce({ ok: true, json: async () => pageTwo });
		vi.stubGlobal('fetch', fetchMock);
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		const body = await response.json();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(body.stable.tag).toBe('v1.0.0');
		expect(body.nightly.tag).toBe('nightly-0');
	});
});

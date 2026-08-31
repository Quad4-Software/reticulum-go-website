import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

function createEvent(): RequestEvent {
	return {
		request: new Request('http://localhost/api/ren-browser/releases'),
		params: {},
		route: { id: '/api/ren-browser/releases' },
		fetch: globalThis.fetch,
		getClientAddress: () => '',
		cookies: {} as RequestEvent['cookies'],
		locals: {},
		platform: undefined,
		url: new URL('http://localhost/api/ren-browser/releases'),
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
		tag_name: 'v0.2.1',
		name: 'Ren Browser 0.2.1',
		published_at: '2026-07-27T12:08:53Z',
		prerelease: false,
		draft: false,
		html_url: 'https://github.com/Quad4-Software/Ren-Browser/releases/tag/v0.2.1',
		assets: [
			{
				name: 'renbrowser-linux-amd64.AppImage',
				size: 100,
				browser_download_url: 'https://example.com/appimage',
				content_type: 'application/octet-stream'
			}
		]
	},
	{
		tag_name: 'v0.3.0-nightly',
		name: 'Nightly',
		published_at: '2026-08-01T00:00:00Z',
		prerelease: true,
		draft: false,
		html_url: 'https://example.com/ren-browser/releases/tag/v0.3.0-nightly',
		assets: []
	}
];

describe('GET /api/ren-browser/releases', () => {
	beforeEach(async () => {
		vi.resetModules();
		vi.stubGlobal('fetch', vi.fn());
		const mod = await import('$lib/server/ren-browser-releases');
		mod.__resetRenBrowserReleaseCacheForTests();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns 503 when GitHub is unavailable', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(503);
	});

	it('returns stable and nightly releases', async () => {
		(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => releasePayload
		});
		const { GET } = await import('./+server');
		const response = await GET(createEvent());
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.stable.tag).toBe('v0.2.1');
		expect(body.nightly.tag).toBe('v0.3.0-nightly');
		expect(response.headers.get('Cache-Control')).toContain('max-age=900');
	});

	it('reuses cache within 15 minutes', async () => {
		vi.useFakeTimers({ now: 0 });
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, json: async () => releasePayload })
			.mockResolvedValueOnce({ ok: true, json: async () => releasePayload });
		vi.stubGlobal('fetch', fetchMock);
		const { GET } = await import('./+server');

		await GET(createEvent());
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await GET(createEvent());
		expect(fetchMock).toHaveBeenCalledTimes(1);

		vi.setSystemTime(15 * 60 * 1000 + 1);
		await GET(createEvent());
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
